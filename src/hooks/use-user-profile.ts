
'use client';

import * as React from 'react';
import { useToast } from './use-toast';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { UserProfile, UserRole } from '@/lib/types';


const defaultProfile: Omit<UserProfile, 'email' | 'workplace' | 'hometown' | 'role'> = {
  fullName: 'Yeni Kullanıcı',
  title: 'Öğretmen',
  branch: 'Belirtilmemiş',
  avatarUrl: `https://placehold.co/96x96.png`,
};

// E-posta adresi için özel admin kontrolü
const ADMIN_EMAIL = 'rahmi.aksu.47@gmail.com';

export function useUserProfile(userId?: string) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setProfile(null);
      return;
    }

    setIsLoading(true);
    const profileDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(profileDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        if (user?.email) {
          try {
            const userRole: UserRole = user.email === ADMIN_EMAIL ? 'admin' : 'beklemede';
            
            const newProfile: UserProfile = {
              ...defaultProfile,
              email: user.email,
              workplace: 'Okul Belirtilmemiş',
              hometown: 'Memleket Belirtilmemiş',
              role: userRole,
            };
            
            await setDoc(profileDocRef, newProfile);
            setProfile(newProfile);

          } catch (error: any) {
            console.error("Failed to create default profile:", error);
            toast({
              title: 'Profil Oluşturulamadı',
              description: `Bir hata oluştu: ${error.message}`,
              variant: 'destructive',
            });
          }
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to load profile from Firestore", error);
      toast({
        title: 'Profil Yüklenemedi',
        description: 'Profil bilgileriniz yüklenirken bir sorun oluştu.',
        variant: 'destructive',
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, user?.email, toast]);

  const updateProfile = async (updatedProfile: UserProfile) => {
    if (!userId) return;
    const profileDocRef = doc(db, 'users', userId);
    try {
      await setDoc(profileDocRef, updatedProfile, { merge: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Profil Güncellenemedi',
        description: 'Profiliniz güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  return { profile, isLoading, updateProfile };
}
