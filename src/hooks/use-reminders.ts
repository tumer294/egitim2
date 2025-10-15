'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import type { Reminder, Urgency } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { isPast, differenceInHours } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export function useReminders(userId?: string) {
  const { toast } = useToast();
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // For in-app popup notifications
  const [popupReminder, setPopupReminder] = React.useState<Reminder | null>(null);
  const [dismissedPopupId, setDismissedPopupId] = React.useState<string | null>(null);


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
    }, async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: q.path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
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
        
        // If the reminder is updated (completed or rescheduled), hide the popup for it.
        if (popupReminder?.id === reminderId) {
           clearPopupReminder();
        }

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
  
  const clearPopupReminder = () => {
    if (popupReminder) {
      setDismissedPopupId(popupReminder.id);
    }
    setPopupReminder(null);
  };
  
  // Logic for badge count and urgency color
  const { notificationCount, urgency } = React.useMemo(() => {
    const now = new Date();
    const upcoming = reminders.filter(r => !r.isCompleted);
    let count = 0;
    let mostUrgent: Urgency = 'none';
    const urgencyOrder: Urgency[] = ['none', 'info', 'urgent', 'veryUrgent', 'pastDue'];

    for (const r of upcoming) {
        const dueDate = new Date(r.dueDate + (r.time ? `T${r.time}` : 'T23:59:59'));
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        let currentUrgency: Urgency = 'none';
        if (isPast(dueDate)) currentUrgency = 'pastDue';
        else if (hoursUntilDue <= 1) currentUrgency = 'veryUrgent';
        else if (hoursUntilDue <= 24) currentUrgency = 'urgent';
        else if (hoursUntilDue <= 72) currentUrgency = 'info';

        if (currentUrgency !== 'none') {
            count++;
            if (urgencyOrder.indexOf(currentUrgency) > urgencyOrder.indexOf(mostUrgent)) {
                mostUrgent = currentUrgency;
            }
        }
    }
    return { notificationCount: count, urgency: count > 0 ? mostUrgent : 'none' };
  }, [reminders]);

  // Logic for popup notifications
  React.useEffect(() => {
    const activeReminders = reminders.filter(r => !r.isCompleted);
    const now = new Date();

    const overdueReminder = activeReminders.find(reminder => {
      const dueDate = new Date(reminder.dueDate + (reminder.time ? `T${reminder.time}` : 'T23:59:59'));
      return isPast(dueDate) && reminder.id !== dismissedPopupId;
    });

    if (overdueReminder) {
      setPopupReminder(overdueReminder);
    } else {
      setPopupReminder(null);
    }
  }, [reminders, dismissedPopupId]);


  return { 
    reminders, 
    isLoading, 
    addReminder, 
    updateReminder, 
    deleteReminder,
    notificationCount,
    urgency,
    popupReminder,
    clearPopupReminder,
 };
}
