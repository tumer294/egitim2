'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';
import { collection, addDoc, doc, deleteDoc, getDocs, writeBatch, query, getDoc } from 'firebase/firestore';
import type { ForumAuthor } from '@/lib/types';
import { generateRandomCode } from '@/lib/utils';
import type { UserRecord } from 'firebase-admin/auth';


export async function sendNotificationToAllUsersAction(data: { title: string; body: string; author: ForumAuthor }) {
    if (!data.title || !data.body) {
        return { success: false, message: 'Başlık ve içerik boş olamaz.' };
    }

    try {
        const adminDb = getAdminDb();
        
        await addDoc(collection(adminDb, 'notifications'), {
            title: data.title,
            body: data.body,
            author: data.author,
            createdAt: new Date().toISOString(),
        });
        return { success: true, message: 'Duyuru tüm kullanıcılara gönderildi.' };
    } catch (error: any) {
        console.error("Error sending notification:", error);
        return { success: false, message: `Duyuru gönderilirken bir hata oluştu: ${error.message}` };
    }
}

export async function deleteNotificationAction(notificationId: string) {
    if (!notificationId) {
        return { success: false, message: 'Geçersiz bildirim ID.' };
    }
    
    try {
        const adminDb = getAdminDb();
        await adminDb.collection('notifications').doc(notificationId).delete();
        return { success: true, message: 'Duyuru başarıyla silindi.' };
    } catch (error: any) {
        console.error("Error deleting notification:", error);
        return { success: false, message: `Duyuru silinirken bir hata oluştu: ${error.message}` };
    }
}


export async function migrateCodesAction(): Promise<{ success: boolean; message: string; }> {
    try {
        const adminDb = getAdminDb();
        const adminAuth = getAdminAuth();
        if (!adminAuth) {
             throw new Error('Firebase Admin Auth is not available.');
        }

        console.log('Starting migration...');
        const usersSnapshot = await adminDb.collection('users').get();
        let updatedClasses = 0;
        let updatedStudents = 0;
        let createdAuthAccounts = 0;

        const batch = adminDb.batch();

        for (const userDoc of usersSnapshot.docs) {
            const classesSnapshot = await userDoc.ref.collection('classes').get();
            for (const classDoc of classesSnapshot.docs) {
                let classUpdate = {};
                // Assign code to class if it doesn't have one
                if (!classDoc.data().classCode) {
                    const classCode = generateRandomCode(6);
                    classUpdate = { classCode };
                    batch.update(classDoc.ref, classUpdate);
                    updatedClasses++;
                }
                const finalClassCode = classDoc.data().classCode || (classUpdate as any).classCode;
                
                const studentsSnapshot = await classDoc.ref.collection('students').get();
                for (const studentDoc of studentsSnapshot.docs) {
                     let studentUpdate = {};
                    // Assign code to student if it doesn't have one
                    if (!studentDoc.data().studentCode) {
                        const studentCode = generateRandomCode(6);
                        studentUpdate = { studentCode };
                        batch.update(studentDoc.ref, studentUpdate);
                        updatedStudents++;
                    }
                    const finalStudentCode = studentDoc.data().studentCode || (studentUpdate as any).studentCode;
                    
                    // Create auth account
                    const email = `${finalClassCode}.${finalStudentCode}@sinifplanim.com`.toUpperCase();
                    try {
                        // Check if user already exists
                        await adminAuth.getUserByEmail(email);
                    } catch (error: any) {
                        if (error.code === 'auth/user-not-found') {
                            // User does not exist, create them
                            const studentData = studentDoc.data();
                            await adminAuth.createUser({
                                email: email,
                                password: finalStudentCode,
                                displayName: `${studentData.firstName} ${studentData.lastName}`,
                            });
                            createdAuthAccounts++;
                        } else {
                            // Re-throw other errors
                            throw error;
                        }
                    }
                }
            }
        }

        await batch.commit();

        const message = `İşlem tamamlandı. ${updatedClasses} sınıf ve ${updatedStudents} öğrenci için kod atandı. ${createdAuthAccounts} yeni öğrenci kimlik doğrulama hesabı oluşturuldu.`;
        console.log(message);
        return { success: true, message };
    } catch (error: any) {
        console.error('Migration failed:', error);
        return { success: false, message: `Geçiş işlemi sırasında bir hata oluştu: ${error.message}` };
    }
}
