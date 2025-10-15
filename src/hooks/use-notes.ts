
'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import type { Note, NoteChecklistItem } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, where, updateDoc } from 'firebase/firestore';
import { speechToNoteAction } from '@/app/actions';
import type { SpeechToNoteOutput } from '@/ai/flows/speech-to-note';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export function useNotes(userId?: string) {
  const { toast } = useToast();
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRecording, setIsRecording] = React.useState(false);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);
  
  React.useEffect(() => {
    if (!userId) {
        setNotes([]);
        setIsLoading(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        return;
    }

    setIsLoading(true);
    const notesCollectionRef = collection(db, 'users', userId, 'notes');
    const q = query(
      notesCollectionRef,
      orderBy('date', 'desc')
    );

    const unsubscribeNotes = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      
      // Sort on the client-side: pinned notes first, then by date
      notesData.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // If both have same pinned status, sort by date (already sorted by query, but good for safety)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setNotes(notesData);
      setIsLoading(false);
    }, async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: q.path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
    });

    return () => {
        unsubscribeNotes();
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, [userId, toast]);
  
  const handleToggleRecording = async (onResult: (result: SpeechToNoteOutput, rawTranscript: string) => void) => {
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
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = async () => {
      setIsRecording(false);
      if (finalTranscript.trim()) {
        setIsTranscribing(true);
        try {
          const result = await speechToNoteAction({ transcript: finalTranscript });
          if(result.error) {
            toast({ title: 'Çeviri Hatası', description: result.error, variant: 'destructive' });
            onResult({ type: 'text', note: finalTranscript, items: [] }, finalTranscript); // Fallback
          } else if (result.note || (result.items && result.items.length > 0)) {
            onResult(result, finalTranscript);
          } else {
            onResult({ type: 'text', note: finalTranscript, items: [] }, finalTranscript); // Fallback
          }
        } catch (e: any) {
            toast({ title: 'AI Hatası', description: e.message, variant: 'destructive' });
            onResult({ type: 'text', note: finalTranscript, items: [] }, finalTranscript); // Fallback
        } finally {
            setIsTranscribing(false);
        }
      }
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({ title: 'Bir hata oluştu', description: `Ses tanıma hatası: ${event.error}`, variant: 'destructive' });
      }
      setIsRecording(false);
      setIsTranscribing(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // You can use the interimTranscript to show live feedback if needed
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
        userId: userId,
        isPinned: noteData.isPinned || false,
        textColor: noteData.textColor || '#000000',
    };

    if (!dataToSave.imageUrl) {
        delete dataToSave.imageUrl;
    }

    if (dataToSave.type === 'checklist') {
        dataToSave.items = dataToSave.items.filter((item: any) => item.text.trim() !== '');
    }
    
    try {
        const notesCollectionRef = collection(db, 'users', userId, 'notes');
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
        const noteDocRef = doc(db, 'users', userId, 'notes', noteId);
        
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
        const noteDocRef = doc(db, 'users', userId, 'notes', noteId);
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
