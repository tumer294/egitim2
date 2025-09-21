
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import type { ForumAuthor } from '@/lib/types';


export async function sendNotificationToAllUsersAction(data: { title: string; body: string; author: ForumAuthor }) {
    if (!data.title || !data.body) {
        return { success: false, message: 'Başlık ve içerik boş olamaz.' };
    }

    try {
        await addDoc(collection(db, 'notifications'), {
            title: data.title,
            body: data.body,
            author: data.author,
            createdAt: new Date().toISOString(),
        });
        return { success: true, message: 'Duyuru tüm kullanıcılara gönderildi.' };
    } catch (error) {
        console.error("Error sending notification:", error);
        return { success: false, message: 'Duyuru gönderilirken bir hata oluştu.' };
    }
}

export async function deleteNotificationAction(notificationId: string) {
    if (!notificationId) {
        return { success: false, message: 'Geçersiz bildirim ID.' };
    }
    
    try {
        await deleteDoc(doc(db, 'notifications', notificationId));
        return { success: true, message: 'Duyuru başarıyla silindi.' };
    } catch (error) {
        console.error("Error deleting notification:", error);
        return { success: false, message: 'Duyuru silinirken bir hata oluştu.' };
    }
}
