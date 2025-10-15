'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc, query, where, getDocs, onSnapshot, deleteDoc } from 'firebase/firestore';
import type { SurveyResult } from '@/lib/types';
import { useAuth } from './use-auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export function useSurveys() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const saveSurveyResult = async (surveyData: Omit<SurveyResult, 'id' | 'userId'>) => {
        setIsLoading(true);
        const currentUser = auth.currentUser;

        if (!currentUser) {
            toast({
                title: 'Hata: Oturum Açılmamış',
                description: 'Sonuçları kaydetmek için kullanıcı girişi gereklidir.',
                variant: 'destructive',
            });
            setIsLoading(false);
            throw new Error('Kullanıcı girişi yapılmamış.');
        }

        try {
            const surveysCollectionRef = collection(db, `users/${currentUser.uid}/surveys`);
            await addDoc(surveysCollectionRef, { ...surveyData, userId: currentUser.uid });
            
        } catch (error: any) {
            console.error("Error saving survey result to Firestore:", error);
            setIsLoading(false);
            // Re-throw a more user-friendly error
            throw new Error('Anket sonuçları veritabanına kaydedilirken bir hata oluştu: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return { saveSurveyResult, isLoading };
}

export function useStudentSurveys(studentId: string | null) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [surveys, setSurveys] = React.useState<SurveyResult[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (!user?.uid || !studentId) {
            setSurveys([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const surveysRef = collection(db, `users/${user.uid}/surveys`);
        const q = query(surveysRef, where("studentId", "==", studentId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const surveysData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurveyResult));
            setSurveys(surveysData);
            setIsLoading(false);
        }, async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: q.path,
                operation: 'list',
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [user?.uid, studentId, toast]);

    const deleteSurvey = async (surveyId: string) => {
        if (!user?.uid) return false;
        try {
            await deleteDoc(doc(db, `users/${user.uid}/surveys`, surveyId));
            toast({title: "Anket Sonucu Silindi", variant: "destructive"});
            return true;
        } catch (error) {
            console.error("Error deleting survey:", error);
            toast({title: "Hata", description: "Anket sonucu silinirken bir hata oluştu.", variant: "destructive"});
            return false;
        }
    };

    return { surveys, isLoading, deleteSurvey };
}
