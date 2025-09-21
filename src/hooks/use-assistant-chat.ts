
'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, query, orderBy, writeBatch, getDocs } from 'firebase/firestore';
import type { ChatMessage } from '@/lib/types';

export function useAssistantChat(userId?: string) {
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const messagesCollectionRef = userId ? collection(db, `users/${userId}/assistantMessages`) : null;

  React.useEffect(() => {
    if (!messagesCollectionRef) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(messagesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching assistant chat messages:", error);
      toast({
        title: "Sohbet Yüklenemedi",
        description: "Mesaj geçmişiniz yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);

  const addMessage = async (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!messagesCollectionRef) {
      toast({ title: 'Hata', description: 'Mesaj göndermek için kullanıcı girişi gereklidir.', variant: 'destructive' });
      return;
    }

    try {
      await addDoc(messagesCollectionRef, {
        ...messageData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error adding message to Firestore:", error);
      toast({
        title: 'Hata!',
        description: 'Mesajınız kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };
  
  const clearChat = async () => {
    if (!messagesCollectionRef) {
      toast({ title: 'Hata', description: 'Sohbeti temizlemek için kullanıcı girişi gereklidir.', variant: 'destructive' });
      return;
    }

    try {
      const batch = writeBatch(db);
      const snapshot = await getDocs(messagesCollectionRef);
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch(error) {
       console.error("Error clearing chat history:", error);
       toast({
            title: 'Hata!',
            description: 'Sohbet geçmişi temizlenirken bir hata oluştu.',
            variant: 'destructive',
        });
        throw error;
    }
  }


  return { messages, isLoading, addMessage, clearChat };
}
