
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db, messaging } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';


export function useFCM() {
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window === 'undefined' || !messaging || !('serviceWorker' in navigator)) {
            return;
        }
        
        // Ensure the service worker is ready before trying to get a token.
        navigator.serviceWorker.ready.then(registration => {
            const requestPermissionAndToken = async () => {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted' && user?.uid) {
                        const currentToken = await getToken(messaging, {
                            vapidKey: 'BDU-LEhWMpSeC9Y6d0_9VCquLhl5qtu8Uvwt97e2wp0yo2mGg0qLLpXjh_hB9w9d6MAwV6WAWMcR4OAyuUsGdAM',
                            serviceWorkerRegistration: registration,
                        });
                        
                        if (currentToken) {
                            const userDocRef = doc(db, 'users', user.uid);
                            const unsub = onSnapshot(userDocRef, async (docSnap) => {
                                if(docSnap.exists()){
                                    const profile = docSnap.data() as UserProfile;
                                    if (!profile.fcmTokens || !profile.fcmTokens.includes(currentToken)) {
                                        await updateDoc(userDocRef, {
                                            fcmTokens: arrayUnion(currentToken)
                                        });
                                    }
                                }
                                // We only need to do this check once, so we can unsubscribe immediately.
                                unsub(); 
                            }, (error) => {
                                console.error("Error checking user profile for FCM token:", error);
                                unsub(); // Unsubscribe on error as well.
                            });
                        } else {
                            console.log('No registration token available. Request permission to generate one.');
                        }
                    }
                } catch (error) {
                    console.error('An error occurred while retrieving token. ', error);
                    toast({
                        title: "Bildirim Hatası",
                        description: "Anlık bildirimler için gerekli token alınamadı. Servis çalışanı hatası.",
                        variant: 'destructive',
                    });
                }
            };
    
            if (user) {
                requestPermissionAndToken();
            }
        }).catch(err => {
            console.error('Service Worker registration failed:', err);
             toast({
                title: "Servis Çalışanı Hatası",
                description: "Bildirimler için gerekli arkaplan servisi başlatılamadı.",
                variant: 'destructive',
            });
        });


        const unsubscribeOnMessage = onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });

        return () => {
            unsubscribeOnMessage();
        };

    }, [user, toast]);
}
