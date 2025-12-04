/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Note: Ensure you have granted the 'Firebase Authentication Admin'
// IAM role to the default App Engine service account.
export const createStudentAuthAccount = functions.https.onCall(async (data, context) => {
  const {classId, studentId} = data;

  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Bu işlemi yapmak için yönetici olarak oturum açmalısınız.",
    );
  }

  // Optional: Check if the caller is an admin if you have such a role
  // const userDoc = await db.collection('users').doc(context.auth.uid).get();
  // if (userDoc.data()?.role !== 'admin') {
  //   throw new functions.https.HttpsError('permission-denied', 'Bu işlemi yapma yetkiniz yok.');
  // }

  try {
    const classDocRef = db.collection(`users/${context.auth.uid}/classes`).doc(classId);
    const studentDocRef = classDocRef.collection("students").doc(studentId);

    const [classDoc, studentDoc] = await Promise.all([
      classDocRef.get(),
      studentDocRef.get(),
    ]);

    if (!classDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Belirtilen sınıf bulunamadı.");
    }
    if (!studentDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Belirtilen öğrenci bulunamadı.");
    }

    const classData = classDoc.data();
    const studentData = studentDoc.data();

    if (!classData?.classCode || !studentData?.studentCode) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Öğrenci veya sınıf için kod atanmamış. Lütfen yönetici panelinden kodları atayın.",
      );
    }

    const email = `${classData.classCode}.${studentData.studentCode}@sinifplanim.com`.toUpperCase();
    const password = studentData.studentCode;

    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      console.log(`User already exists: ${existingUser.uid}. No action needed.`);
      return {
        success: true,
        uid: existingUser.uid,
        message: "Öğrenci için zaten bir hesap mevcut.",
      };
    } catch (error: any) {
      if (error.code !== "auth/user-not-found") {
        // Re-throw other errors (e.g., network issues)
        throw error;
      }
      // If user is not found, proceed to create them.
    }

    // Create the new user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: `${studentData.firstName} ${studentData.lastName}`,
    });

    console.log(`Successfully created new user: ${userRecord.uid}`);
    return {
      success: true,
      uid: userRecord.uid,
      message: "Öğrenci kimlik doğrulama hesabı başarıyla oluşturuldu.",
    };
  } catch (error: any) {
    console.error("Error in createStudentAuthAccount function:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsError as is
    }
    throw new functions.https.HttpsError(
      "internal",
      `Bilinmeyen bir sunucu hatası oluştu: ${error.message}`,
    );
  }
});

export const setAdminClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Bu işlemi yapmak için oturum açmalısınız.");
  }
  const callerUid = context.auth.uid;
  const targetUid = data.uid;

  // Verify the caller is an admin by checking their custom claim
  const callerUserRecord = await admin.auth().getUser(callerUid);
  if (callerUserRecord.customClaims?.["admin"] !== true) {
    throw new functions.https.HttpsError("permission-denied", "Bu işlemi yapmak için yönetici yetkisine sahip olmalısınız.");
  }

  try {
    await admin.auth().setCustomUserClaims(targetUid, {admin: true});
    return {message: `Başarılı! Kullanıcı ${targetUid} artık bir yönetici.`};
  } catch (error) {
    console.error("Error setting admin claim:", error);
    throw new functions.https.HttpsError("internal", "Kullanıcıya yönetici yetkisi verilirken bir hata oluştu.");
  }
});

export const deleteUser = functions.https.onCall(async (data, context) => {
    if (context.auth?.token.admin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Bu işlemi sadece adminler yapabilir.');
    }

    const uid = data.uid;
    try {
        await admin.auth().deleteUser(uid);
        await db.collection('users').doc(uid).delete();
        return { success: true, message: `Kullanıcı ${uid} başarıyla silindi.` };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new functions.https.HttpsError('internal', 'Kullanıcı silinirken bir hata oluştu.');
    }
});
