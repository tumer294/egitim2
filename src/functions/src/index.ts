
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const adminDb = admin.firestore();
const adminAuth = admin.auth();

// This is the master admin email that can grant the first admin role.
const MASTER_ADMIN_EMAIL = "rahmi.aksu.47@gmail.com";

// This function sets a custom claim on a user to grant/revoke admin privileges.
export const setAdminClaim = functions.region('europe-west1').https.onCall(async (data, context) => {
    // Check if the caller is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Bu işlemi yapmak için kimliğinizin doğrulanması gerekiyor.'
        );
    }
    
    // The caller must be an admin to set claims for others,
    // UNLESS they are the master admin, who can assign the first admin role.
    const isMasterAdmin = context.auth.token.email === MASTER_ADMIN_EMAIL;
    const isCallerAdmin = context.auth.token.admin === true;

    if (!isCallerAdmin && !isMasterAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Bu işlemi yalnızca admin yetkisine sahip kullanıcılar yapabilir.'
        );
    }

    const { uid, isAdmin } = data;
    if (typeof uid !== 'string' || typeof isAdmin !== 'boolean') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Veri yükü "uid" (string) ve "isAdmin" (boolean) alanlarını içermelidir.'
        );
    }

    try {
        // Set the custom claim on the user's Auth token
        await adminAuth.setCustomUserClaims(uid, { admin: isAdmin });

        // Also update the role in the user's Firestore document for UI consistency
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.update({ role: isAdmin ? 'admin' : 'teacher' });

        return {
            message: `Başarılı! Kullanıcı ${uid} için admin yetkisi ${isAdmin ? 'verildi' : 'kaldırıldı'}.`
        };

    } catch (error: any) {
        console.error(`Admin claim ayarlanırken hata oluştu: uid=${uid}, isAdmin=${isAdmin}`, error);
        throw new functions.https.HttpsError(
            'internal',
            'Kullanıcı yetkileri ayarlanırken bir sunucu hatası oluştu: ' + error.message
        );
    }
});


// This function deletes a user from Firebase Authentication and their Firestore document.
// It can only be called by an authenticated admin.
export const deleteUser = functions.region('europe-west1').https.onCall(async (data, context) => {
    if (context.auth?.token.admin !== true) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Bu işlemi yalnızca admin yetkisine sahip kullanıcılar yapabilir.'
        );
    }

    const { uid } = data;
    if (typeof uid !== 'string') {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Veri yükü "uid" (string) alanını içermelidir.'
        );
    }

    try {
        // Delete user from Auth first.
        await adminAuth.deleteUser(uid);
    } catch (error: any) {
        console.error(`Kullanıcı Auth'dan silinirken hata oluştu: uid=${uid}`, error);
        // If the user is not found in Auth, it might have been already deleted.
        // We can proceed to delete the Firestore data.
        if (error.code !== 'auth/user-not-found') {
            throw new functions.https.HttpsError(
                'internal',
                'Kullanıcı kimliği silinirken bir sunucu hatası oluştu: ' + error.message
            );
        }
    }

    try {
        // Then delete the user document from Firestore
        await adminDb.collection('users').doc(uid).delete();
        return { message: `Kullanıcı ${uid} ve tüm verileri başarıyla silindi.` };
    } catch (error: any) {
        console.error(`Kullanıcı Firestore'dan silinirken hata oluştu: uid=${uid}`, error);
        throw new functions.https.HttpsError(
            'internal',
            'Kullanıcı verileri silinirken bir sunucu hatası oluştu: ' + error.message
        );
    }
});


type NotificationType = '1d' | '1h' | '0h';

export const checkRemindersAndSendNotifications = functions.region('europe-west1').pubsub.schedule('every 1 hours').onRun(async (context) => {
    console.log('Checking reminders to send notifications...');

    const now = new Date();
    // We check for reminders due in the next 25 hours to catch all cases within our 1-hour function run interval.
    const checkUntil = new Date(now.getTime() + (25 * 60 * 60 * 1000)); 

    const remindersQuery = adminDb.collectionGroup('reminders')
        .where('isCompleted', '==', false)
        .where('dueDate', '<=', checkUntil.toISOString().split('T')[0]);

    try {
        const snapshot = await remindersQuery.get();
        if (snapshot.empty) {
            console.log('No active reminders found.');
            return null;
        }

        const notificationPromises: Promise<any>[] = [];

        for (const doc of snapshot.docs) {
            const reminder = doc.data();
            const reminderId = doc.id;
            const userId = doc.ref.parent.parent?.id;

            if (!userId) continue;

            // Handle reminders with and without a specific time
            const dueDateString = reminder.dueDate + (reminder.time ? `T${reminder.time}:00` : 'T00:00:00');
            const dueDate = new Date(dueDateString);

            // If no time is set, treat it as due at the beginning of the day.
            // If the day is already past, no need to send "on time" or "1h" notifications.
            if (!reminder.time && now.getTime() > dueDate.getTime() + (24*60*60*1000)) continue;

            const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

            const notificationsSent: NotificationType[] = reminder.notificationsSent || [];
            let notificationToSend: { type: NotificationType; message: string } | null = null;
            
            // 1 Day notification (between 23 and 24 hours before)
            if (hoursUntilDue > 23 && hoursUntilDue <= 24 && !notificationsSent.includes('1d')) {
                notificationToSend = { type: '1d', message: `Hatırlatma: "${reminder.title}" görevinin son tarihine 1 gün kaldı.` };
            } 
            // 1 Hour notification (between 0 and 1 hour before)
            else if (hoursUntilDue > 0 && hoursUntilDue <= 1 && !notificationsSent.includes('1h')) {
                notificationToSend = { type: '1h', message: `Hatırlatma: "${reminder.title}" görevinin son tarihine 1 saat kaldı.` };
            } 
            // On-time notification (within the past hour)
            else if (hoursUntilDue <= 0 && hoursUntilDue > -1 && !notificationsSent.includes('0h')) {
                 notificationToSend = { type: '0h', message: `Zamanı Geldi: "${reminder.title}" görevinin şimdi yapılması gerekiyor.` };
            }


            if (notificationToSend) {
                const userDoc = await adminDb.collection('users').doc(userId).get();
                const userData = userDoc.data();
                const fcmTokens = userData?.fcmTokens || [];

                if (fcmTokens.length > 0) {
                    const messagePayload = {
                        notification: {
                            title: 'SınıfPlanım Hatırlatma',
                            body: notificationToSend.message,
                        },
                        tokens: fcmTokens,
                    };

                    console.log(`Sending notification type ${notificationToSend.type} for reminder ${reminderId} to user ${userId}`);
                    notificationPromises.push(admin.messaging().sendMulticast(messagePayload));

                    // Mark notification as sent
                    const updatedSent = [...notificationsSent, notificationToSend.type];
                    notificationPromises.push(doc.ref.update({ notificationsSent: updatedSent }));
                }
            }
        }

        await Promise.all(notificationPromises);
        console.log('Finished checking reminders.');
        return null;
    } catch (error) {
        console.error('Error checking reminders and sending notifications:', error);
        return null;
    }
});
