
'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import type { Reminder } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';

export function useReminders(userId?: string) {
  const { toast } = useToast();
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setReminders([]);
      return;
    }

    setIsLoading(true);
    const remindersCollectionRef = collection(db, `users/${userId}/reminders`);
    const q = query(remindersCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remindersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
      setReminders(remindersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching reminders:", error);
      toast({
        title: "Hata",
        description: "Hatırlatıcılar yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);

  const addReminder = async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'isCompleted'>) => {
    if (!userId) {
        toast({ title: 'Hata', description: 'Hatırlatıcı eklemek için kullanıcı girişi gereklidir.', variant: 'destructive'});
        return;
    }
    
    const newReminder: Omit<Reminder, 'id'> = {
        ...reminderData,
        isCompleted: false,
        createdAt: new Date().toISOString(),
    };

    try {
        const remindersCollectionRef = collection(db, `users/${userId}/reminders`);
        await addDoc(remindersCollectionRef, newReminder);
    } catch (error) {
        console.error("Error adding reminder to Firestore:", error);
        toast({
            title: 'Hata!',
            description: 'Hatırlatıcınız veritabanına kaydedilirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };
  
  const updateReminder = async (reminderId: string, data: Partial<Reminder>) => {
    if (!userId) {
        toast({ title: 'Hata', description: 'Hatırlatıcı güncellemek için kullanıcı girişi gereklidir.', variant: 'destructive'});
        return;
    }
    try {
        const reminderDocRef = doc(db, `users/${userId}/reminders`, reminderId);
        await updateDoc(reminderDocRef, data);
    } catch (error) {
        console.error("Error updating reminder in Firestore:", error);
        toast({
            title: 'Hata!',
            description: 'Hatırlatıcınız güncellenirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };


  const deleteReminder = async (reminderId: string) => {
     if (!userId) {
        toast({ title: 'Hata', description: 'Hatırlatıcı silmek için kullanıcı girişi gereklidir.', variant: 'destructive'});
        return;
    }
    try {
        const reminderDocRef = doc(db, `users/${userId}/reminders`, reminderId);
        await deleteDoc(reminderDocRef);
        toast({
            title: 'Hatırlatıcı Silindi',
            variant: 'destructive',
        });
    } catch(error) {
         console.error("Error deleting reminder from Firestore:", error);
         toast({
            title: 'Hata!',
            description: 'Hatırlatıcınız silinirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };

  return { reminders, isLoading, addReminder, updateReminder, deleteReminder };
}
