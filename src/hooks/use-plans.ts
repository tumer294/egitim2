
'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import type { Plan } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export function usePlans(userId?: string) {
  const { toast } = useToast();
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setPlans([]);
      return;
    }

    setIsLoading(true);
    const plansCollectionRef = collection(db, `users/${userId}/plans`);
    const q = query(plansCollectionRef, orderBy('uploadDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
      setPlans(plansData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching plans from Firestore:", error);
      toast({
        title: "Planlar Yüklenemedi",
        description: "Planlarınız veritabanından yüklenirken bir sorun oluştu.",
        variant: "destructive"
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);

  const addPlan = async (planData: Omit<Plan, 'id'>) => {
    if (!userId) {
        toast({ title: 'Hata', description: 'Plan eklemek için kullanıcı girişi gereklidir.', variant: 'destructive'});
        return;
    }

    try {
        const plansCollectionRef = collection(db, `users/${userId}/plans`);
        await addDoc(plansCollectionRef, planData);
        toast({
          title: 'Plan Eklendi!',
          description: 'Yeni planınız başarıyla eklendi.',
        });
    } catch (error) {
        console.error("Error adding plan to Firestore:", error);
        toast({
            title: 'Hata!',
            description: 'Planınız veritabanına kaydedilirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };

  const deletePlan = async (planId: string) => {
     if (!userId) {
        toast({ title: 'Hata', description: 'Plan silmek için kullanıcı girişi gereklidir.', variant: 'destructive'});
        return;
    }
    try {
        const planToDelete = plans.find(p => p.id === planId);
        const planDocRef = doc(db, `users/${userId}/plans`, planId);
        await deleteDoc(planDocRef);
        toast({
            title: 'Plan Silindi',
            description: `"${planToDelete?.title}" adlı planınız başarıyla silindi.`,
            variant: 'destructive',
        });
    } catch(error) {
         console.error("Error deleting plan from Firestore:", error);
         toast({
            title: 'Hata!',
            description: 'Planınız silinirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };

  return { plans, isLoading, addPlan, deletePlan };
}
