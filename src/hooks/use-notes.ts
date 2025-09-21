
'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import type { Note } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore';
import { speechToNoteAction } from '@/app/actions';

export function useNotes(userId?: string) {
  const { toast } = useToast();
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setNotes([]);
      return;
    }

    setIsLoading(true);
    // A single, simple query that doesn't require a composite index.
    // We will sort in the client.
    const notesCollectionRef = collection(db, `users/${userId}/notes`);
    const q = query(notesCollectionRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      
      // Sort client-side: pinned notes first, then by date (which they already are)
      notesData.sort((a, b) => {
        const aPinned = !!a.isPinned;
        const bPinned = !!b.isPinned;
        if (aPinned === bPinned) {
          return 0; // Keep original date order
        }
        return aPinned ? -1 : 1; // Pinned notes come first
      });

      setNotes(notesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notes:", error);
      // This is a simplified query, so index errors are highly unlikely.
      // If it fails, it's likely a permissions or network issue.
      toast({
        title: "Hata",
        description: "Notlar yüklenirken bir hata oluştu.",
        variant: "destructive"
      });
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [userId, toast]);
  
  const handleToggleRecording = async (onResult: (text: string) => void) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Desteklenmiyor', description: 'Tarayıcınız sesle yazmayı desteklemiyor.', variant: 'destructive' });
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'tr-TR';
    recognition.continuous = false; // We want to process text when user stops talking
    recognition.interimResults = false;

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = async () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        setIsTranscribing(true);
        const result = await speechToNoteAction({ transcript: finalTranscript });
        if (result.note) {
          onResult(result.note);
        } else if (result.error) {
          toast({ title: 'Çeviri Hatası', description: result.error, variant: 'destructive' });
          onResult(finalTranscript); // Fallback to raw transcript
        } else {
           onResult(finalTranscript); // Fallback to raw transcript if AI gives no response
        }
        setIsTranscribing(false);
      }
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        toast({ title: 'Bir hata oluştu', description: `Ses tanıma hatası: ${event.error}`, variant: 'destructive' });
      }
      setIsRecording(false);
      setIsTranscribing(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      finalTranscript = event.results[0][0].transcript;
    };

    recognition.start();
  };

  const addNote = async (noteData: Omit<Note, 'id'>) => {
    if (!userId) {
        toast({ title: 'Hata', description: 'Not eklemek için kullanıcı girişi gereklidir.', variant: 'destructive'});
        return;
    }

    const dataToSave: { [key: string]: any } = { 
        ...noteData,
        isPinned: noteData.isPinned || false, // Ensure isPinned is never undefined
        textColor: noteData.textColor || '#000000',
    };

    if (!dataToSave.imageUrl) {
        delete dataToSave.imageUrl;
    }

    if (dataToSave.type === 'checklist') {
        dataToSave.items = dataToSave.items.filter((item: any) => item.text.trim() !== '');
    }
    
    try {
        const notesCollectionRef = collection(db, `users/${userId}/notes`);
        await addDoc(notesCollectionRef, dataToSave);
    } catch (error) {
        console.error("Error adding note to Firestore:", error);
        toast({
            title: 'Hata!',
            description: 'Notunuz veritabanına kaydedilirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };

  const updateNote = async (noteId: string, data: Partial<Note>) => {
    if (!userId) {
        toast({ title: 'Hata', description: 'Not güncellemek için kullanıcı girişi gereklidir.', variant: 'destructive'});
        return;
    }
    try {
        const noteDocRef = doc(db, `users/${userId}/notes`, noteId);
        
        const dataToUpdate: { [key: string]: any } = {...data};
        if (dataToUpdate.isPinned === undefined) {
            delete dataToUpdate.isPinned;
        }

        if (dataToUpdate.type === 'checklist' && dataToUpdate.items) {
            dataToUpdate.items = dataToUpdate.items.filter((item: any) => item.text.trim() !== '');
        }

        await updateDoc(noteDocRef, dataToUpdate);
    } catch (error) {
        console.error("Error updating note in Firestore:", error);
        toast({
            title: 'Hata!',
            description: 'Notunuz güncellenirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };


  const deleteNote = async (noteId: string) => {
     if (!userId) {
        toast({ title: 'Hata', description: 'Not silmek için kullanıcı girişi gereklidir.', variant: 'destructive'});
        return;
    }
    try {
        const noteDocRef = doc(db, `users/${userId}/notes`, noteId);
        await deleteDoc(noteDocRef);
        toast({
            title: 'Not Silindi',
            description: 'Notunuz başarıyla silindi.',
            variant: 'destructive',
        });
    } catch(error) {
         console.error("Error deleting note from Firestore:", error);
         toast({
            title: 'Hata!',
            description: 'Notunuz silinirken bir hata oluştu.',
            variant: 'destructive',
        });
    }
  };

  return { notes, isLoading, addNote, updateNote, deleteNote, isRecording, isTranscribing, handleToggleRecording };
}
