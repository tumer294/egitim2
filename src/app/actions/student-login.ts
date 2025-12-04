'use server';

import { getAdminDb } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';

interface StudentLoginResult {
    success: boolean;
    student?: Student;
    classId?: string;
    error?: string;
}

export async function studentLoginAction(classCode: string, studentCode: string): Promise<StudentLoginResult> {
    const adminDb = getAdminDb();

    try {
        // 1. Get all teachers
        const usersSnapshot = await adminDb.collection('users').where('role', '==', 'teacher').get();
        if (usersSnapshot.empty) {
            return { success: false, error: 'Sistemde hiç öğretmen bulunamadı.' };
        }

        // 2. Iterate through each teacher to find the class
        for (const userDoc of usersSnapshot.docs) {
            const classesRef = userDoc.ref.collection('classes');
            const classQuerySnapshot = await classesRef.where('classCode', '==', classCode).limit(1).get();

            if (!classQuerySnapshot.empty) {
                const classDoc = classQuerySnapshot.docs[0];

                // 3. Found the class, now find the student in that class
                const studentsRef = classDoc.ref.collection('students');
                const studentQuerySnapshot = await studentsRef.where('studentCode', '==', studentCode).limit(1).get();

                if (!studentQuerySnapshot.empty) {
                    const studentDoc = studentQuerySnapshot.docs[0];
                    const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
                    
                    // 4. Success! Return the student data.
                    return {
                        success: true,
                        student: studentData,
                        classId: classDoc.id,
                    };
                }
            }
        }
        
        // 5. If loops complete without returning, no match was found.
        return { success: false, error: 'Sınıf kodu veya öğrenci kodu hatalı.' };

    } catch (error: any) {
        console.error("Critical error in studentLoginAction: ", error);
        return { success: false, error: 'Giriş yapılırken beklenmedik bir sunucu hatası oluştu.' };
    }
}
