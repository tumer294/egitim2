
'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import type { DailyRecord, Student, ClassInfo } from '@/lib/types';
import { db } from '@/lib/firebase';
import { 
    collection, onSnapshot, doc, getDocs, writeBatch, deleteDoc, addDoc, updateDoc, query, where, setDoc, collectionGroup
} from 'firebase/firestore';


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
    }, (error) => {
        console.error("Error fetching records:", error);
        toast({
            title: "Kayıtlar Yüklenemedi",
            description: "Günlük kayıtlar yüklenirken bir sorun oluştu.",
            variant: "destructive"
        });
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

  return { records, isLoading, bulkUpdateRecords };
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
        }, (error) => {
            console.error("Error fetching all records:", error);
            toast({
                title: "Tüm Kayıtlar Yüklenemedi",
                description: "Tüm sınıfların kayıtları yüklenirken bir sorun oluştu.",
                variant: "destructive"
            });
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
            const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, students: [] }));

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
                });
            });

            // Set initial classes and then let student snapshots update them
            setClasses(classesData);
            setIsLoading(false);

            // Return a cleanup function that unsubscribes from all student listeners
            return () => unsubscribers.forEach(unsub => unsub());

        }, (error) => {
            console.error("Failed to load classes from Firestore", error);
            toast({ title: "Hata", description: "Sınıf verileri yüklenemedi.", variant: 'destructive' });
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
        await addDoc(userClasses, { name: className });
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
    
    const addStudent = async (userId: string, classId: string, studentData: Omit<Student, 'id'|'classId'>) => {
        const studentsRef = collection(db, `users/${userId}/classes/${classId}/students`);
        const q = query(studentsRef, where("studentNumber", "==", studentData.studentNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error(`Bu numaraya sahip bir öğrenci zaten mevcut.`);
        }
        await addDoc(studentsRef, { ...studentData, classId });
    };

    const addMultipleStudents = async (userId: string, classId: string, newStudents: Omit<Student, 'id'|'classId'>[]) => {
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
            batch.set(studentRef, {...student, classId});
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
         await updateDoc(studentRef, studentData);
    };

    const deleteStudent = async (userId: string, classId: string, studentId: string) => {
        const studentRef = doc(db, `users/${userId}/classes/${classId}/students`, studentId);
        await deleteDoc(studentRef);
    };

    const bulkAddClassesAndStudents = async (userId: string, data: { className: string, students: Omit<Student, 'id'|'classId'>[] }[]) => {
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
                batch.set(newClassRef, { name: classData.className });
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
                    batch.set(newStudentRef, { ...student, classId });
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
