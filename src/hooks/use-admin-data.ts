
'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, getDocs, query } from 'firebase/firestore';
import type { UserProfile } from './use-user-profile';
import type { ClassInfo, Student } from '@/lib/types';


export type UserData = UserProfile & {
    id: string;
    classes: ClassInfo[];
}

export function useAllUsersData(isAdmin: boolean) {
    const { toast } = useToast();
    const [usersData, setUsersData] = React.useState<UserData[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!isAdmin) {
            setIsLoading(false);
            setUsersData([]);
            return;
        }

        setIsLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef);

        const unsubscribe = onSnapshot(q, async (usersSnapshot) => {
            try {
                const allDataPromises = usersSnapshot.docs.map(async (userDoc) => {
                    const userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile & { id: string };

                    // Since we have list permissions now, we can try to fetch subcollections.
                    // However, it's more efficient to do this on demand. For now, we'll keep it simple.
                    const classesRef = collection(db, `users/${userDoc.id}/classes`);
                    const classesSnapshot = await getDocs(classesRef);
                    
                    const classesDataPromises = classesSnapshot.docs.map(async (classDoc) => {
                        const classInfo = { id: classDoc.id, ...classDoc.data() } as ClassInfo;
                        
                        const studentsRef = collection(db, `users/${userDoc.id}/classes/${classDoc.id}/students`);
                        const studentsSnapshot = await getDocs(studentsRef);
                        classInfo.students = studentsSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() } as Student));

                        return classInfo;
                    });

                    const classesData = await Promise.all(classesDataPromises);

                    return {
                        ...userProfile,
                        classes: classesData
                    };
                });

                const allData = await Promise.all(allDataPromises);
                setUsersData(allData);
            } catch (error) {
                 console.error("Error processing user data snapshot:", error);
                 // This might still fail if subcollection reads are denied, but the user list itself should load.
            } finally {
                setIsLoading(false);
            }

        }, (error) => {
            console.error("Error fetching all users data:", error);
            toast({
                title: "Veriler Yüklenemedi",
                description: "Tüm kullanıcı verileri yüklenirken bir sorun oluştu. Güvenlik kurallarını kontrol edin.",
                variant: "destructive"
            });
            setIsLoading(false);
        });


        return () => unsubscribe();
    }, [isAdmin, toast]);

    return { usersData, isLoading, setUsersData };
}
