
'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import type { DailyRecord, Student, ClassInfo } from '@/lib/types';
import { db } from '@/lib/firebase';
import { 
    collection, onSnapshot, doc, getDocs, writeBatch, deleteDoc, addDoc, updateDoc, query, where, setDoc, collectionGroup, getDoc
} from 'firebase/firestore';
import { generateRandomCode } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';


// This hook is for fetching records for a SPECIFIC class, used in GunlukTakipPage
export function useDailyRecords(userId?: string, classId?: string) {
  const { toast } = useToast();
  const [records, setRecords] = React.useState<DailyRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId || !classId) {
        setRecords([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const recordsCollectionRef = collection(db, `users/${userId}/classes/${classId}/records`);
    
    const unsubscribe = onSnapshot(recordsCollectionRef, (snapshot) => {
        const recordsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyRecord));
        setRecords(recordsData);
        setIsLoading(false);
    }, async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: recordsCollectionRef.path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, classId, toast]);

  const bulkUpdateRecords = async (userId: string, classId: string, date: string, updatedDayRecords: DailyRecord[]) => {
    const batch = writeBatch(db);

    updatedDayRecords.forEach(record => {
        const docRef = doc(db, `users/${userId}/classes/${classId}/records`, record.id);
        const { id, ...recordData } = record;
        batch.set(docRef, recordData, { merge: true });
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error bulk updating records:", error);
        toast({
            title: "Kayıtlar Kaydedilemedi",
            description: "Değişiklikleriniz kaydedilirken bir sorun oluştu.",
            variant: "destructive"
        });
        throw error;
    }
  };

  return { records, isLoading, _bulkUpdateRecords: bulkUpdateRecords, bulkUpdateRecords };
}

// This hook is for fetching ALL records for a user across ALL classes, used in AnaSayfa
export function useAllRecords(userId?: string) {
    const { toast } = useToast();
    const [records, setRecords] = React.useState<DailyRecord[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!userId) {
            setRecords([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const recordsQuery = query(collectionGroup(db, 'records'));

        const unsubscribe = onSnapshot(recordsQuery, (querySnapshot) => {
            const recordsData: DailyRecord[] = [];
            querySnapshot.forEach((doc) => {
                if(doc.ref.path.startsWith(`users/${userId}/`)){
                     recordsData.push({ id: doc.id, ...doc.data() } as DailyRecord);
                }
            });
            setRecords(recordsData);
            setIsLoading(false);
        }, async (serverError) => { // Error callback
            if (serverError.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: 'records (collectionGroup)',
                    operation: 'list',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error("Error fetching all records:", serverError);
                toast({
                    title: "Tüm Kayıtlar Yüklenemedi",
                    description: "Tüm sınıfların kayıtları yüklenirken bir sorun oluştu.",
                    variant: "destructive"
                });
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, toast]);
    
    return { records, isLoading };
}

export function useClassesAndStudents(userId?: string) {
    const { toast } = useToast();
    const [classes, setClasses] = React.useState<ClassInfo[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!userId) {
            setClasses([]);
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        const q = query(collection(db, `users/${userId}/classes`));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, classCode: doc.data().classCode, students: [] }));

            const unsubscribers = classesData.map((classInfo, index) => {
                const studentsQuery = query(collection(db, `users/${userId}/classes/${classInfo.id}/students`));
                return onSnapshot(studentsQuery, studentSnapshot => {
                    const students = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
                    
                    setClasses(currentClasses => {
                        const newClasses = [...currentClasses];
                        const classIndex = newClasses.findIndex(c => c.id === classInfo.id);
                        if(classIndex > -1){
                            newClasses[classIndex] = {...newClasses[classIndex], students };
                        } else {
                            // This might happen if classes change while students are loading
                            newClasses.push({...classInfo, students});
                        }
                        return newClasses;
                    });
                }, async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: studentsQuery.path,
                        operation: 'list',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                });
            });

            // Set initial classes and then let student snapshots update them
            setClasses(classesData);
            setIsLoading(false);

            // Return a cleanup function that unsubscribes from all student listeners
            return () => unsubscribers.forEach(unsub => unsub());

        }, async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: q.path,
                operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        });

        // The main unsubscribe function for the classes listener
        return () => unsubscribe();
    }, [userId, toast]);
    
    const addClass = async (userId: string, className: string) => {
        const userClasses = collection(db, `users/${userId}/classes`);
        const q = query(userClasses, where("name", "==", className));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            throw new Error(`"${className}" adında bir sınıf zaten mevcut.`);
        }
        await addDoc(userClasses, { name: className, classCode: generateRandomCode(6) });
    };
    
    const updateClass = async (userId: string, classId: string, newName: string) => {
        const userClasses = collection(db, `users/${userId}/classes`);
        const q = query(userClasses, where("name", "==", newName));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty && querySnapshot.docs[0].id !== classId) {
             throw new Error(`"${newName}" adında bir sınıf zaten mevcut.`);
        }
        const classRef = doc(db, `users/${userId}/classes`, classId);
        await updateDoc(classRef, { name: newName });
    };

    const deleteClass = async (userId: string, classId: string) => {
        const batch = writeBatch(db);
        const classRef = doc(db, `users/${userId}/classes`, classId);
        
        const studentsSnapshot = await getDocs(collection(db, `users/${userId}/classes/${classId}/students`));
        studentsSnapshot.forEach(doc => batch.delete(doc.ref));

        const recordsSnapshot = await getDocs(collection(db, `users/${userId}/classes/${classId}/records`));
        recordsSnapshot.forEach(doc => batch.delete(doc.ref));
        
        batch.delete(classRef);
        
        await batch.commit();
    };
    
    const addStudent = async (userId: string, classId: string, studentData: Omit<Student, 'id'|'classId'|'studentCode'>) => {
        const studentsRef = collection(db, `users/${userId}/classes/${classId}/students`);
        const q = query(studentsRef, where("studentNumber", "==", studentData.studentNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error(`Bu numaraya sahip bir öğrenci zaten mevcut.`);
        }
        
        const studentCode = generateRandomCode(6);
        const newStudentDocRef = doc(studentsRef);
        
        await setDoc(newStudentDocRef, { ...studentData, classId, studentCode });
        
        // This part is moved to a batch operation in the admin panel.
        // It's more reliable to create auth users in bulk by an admin
        // than trying to do it via a server action on every student addition.
    };

    const addMultipleStudents = async (userId: string, classId: string, newStudents: Omit<Student, 'id'|'classId'|'studentCode'>[]) => {
         const studentsRef = collection(db, `users/${userId}/classes/${classId}/students`);
         const existingStudentsSnapshot = await getDocs(studentsRef);
         const existingNumbers = new Set(existingStudentsSnapshot.docs.map(doc => doc.data().studentNumber));

         const batch = writeBatch(db);
         const studentsToAdd = newStudents.filter(ns => !existingNumbers.has(ns.studentNumber));
         
         if (studentsToAdd.length < newStudents.length) {
             toast({title: "Uyarı", description: "Mevcut listede olan bazı öğrenci numaraları atlandı."});
         }

         studentsToAdd.forEach(student => {
            const studentRef = doc(collection(db, `users/${userId}/classes/${classId}/students`));
            batch.set(studentRef, {...student, classId, studentCode: generateRandomCode(6)});
         });

         await batch.commit();
    };

    const updateStudent = async (userId: string, classId: string, updatedStudent: Student) => {
         const studentsRef = collection(db, `users/${userId}/classes/${classId}/students`);
         const q = query(studentsRef, where("studentNumber", "==", updatedStudent.studentNumber));
         const querySnapshot = await getDocs(q);

         if (!querySnapshot.empty && querySnapshot.docs[0].id !== updatedStudent.id) {
            throw new Error(`Bu numaraya sahip bir öğrenci zaten mevcut.`);
         }
         const studentRef = doc(db, `users/${userId}/classes/${classId}/students`, updatedStudent.id);
         const { id, ...studentData } = updatedStudent;
         // Ensure student code is not overwritten if it exists
         if (!studentData.studentCode) {
             studentData.studentCode = generateRandomCode(6);
         }
         await updateDoc(studentRef, studentData);
    };

    const deleteStudent = async (userId: string, classId: string, studentId: string) => {
        const studentRef = doc(db, `users/${userId}/classes/${classId}/students`, studentId);
        await deleteDoc(studentRef);
    };

    const bulkAddClassesAndStudents = async (userId: string, data: { className: string, students: Omit<Student, 'id'|'classId'|'studentCode'>[] }[]) => {
        const batch = writeBatch(db);
        const userClassesRef = collection(db, 'users', userId, 'classes');
        const existingClassesSnapshot = await getDocs(userClassesRef);
        const existingClassesMap = new Map(existingClassesSnapshot.docs.map(d => [d.data().name, d.id]));

        let classesAdded = 0;
        let studentsAdded = 0;
        let classesSkipped = 0;
        let studentsSkipped = 0;

        for (const classData of data) {
            let classId = existingClassesMap.get(classData.className);

            if (!classId) {
                // Class doesn't exist, create it
                const newClassRef = doc(userClassesRef);
                batch.set(newClassRef, { name: classData.className, classCode: generateRandomCode(6) });
                classId = newClassRef.id;
                classesAdded++;
            } else {
                classesSkipped++;
            }

            const studentsRef = collection(db, `users/${userId}/classes/${classId}/students`);
            const existingStudentsSnapshot = await getDocs(query(studentsRef));
            const existingStudentNumbers = new Set(existingStudentsSnapshot.docs.map(s => s.data().studentNumber));

            for (const student of classData.students) {
                if (!existingStudentNumbers.has(student.studentNumber)) {
                    const newStudentRef = doc(studentsRef);
                    batch.set(newStudentRef, { ...student, classId, studentCode: generateRandomCode(6) });
                    studentsAdded++;
                } else {
                    studentsSkipped++;
                }
            }
        }

        await batch.commit();
        return { classesAdded, studentsAdded, classesSkipped, studentsSkipped };
    };

    return { classes, isLoading, addClass, updateClass, deleteClass, addStudent, addMultipleStudents, updateStudent, deleteStudent, bulkAddClassesAndStudents };
}
