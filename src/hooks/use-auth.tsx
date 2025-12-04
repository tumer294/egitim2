
'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getAuth,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from './use-user-profile';

const auth = getAuth(app);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, pass: string) => Promise<void>;
  logIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  changePassword: (currentPass: string, newPass: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(mapFirebaseAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(mapFirebaseAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };
  
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (err: any) {
        setError(mapFirebaseAuthError(err.code));
    } finally {
        setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    setError(null);
    try {
        await signOut(auth);
    } catch (err: any) {
        setError(mapFirebaseAuthError(err.code));
    } finally {
        setLoading(false);
    }
  };
  
  const sendPasswordReset = async (email: string): Promise<boolean> => {
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch(err: any) {
        setError(mapFirebaseAuthError(err.code));
        return false;
    }
  }

  const changePassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("Kullanıcı bulunamadı veya e-posta adresi yok.");
    }
  
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPass);
      return true;
    } catch (err: any) {
      throw new Error(mapFirebaseAuthError(err.code));
    }
  };


  const value = {
    user,
    loading,
    error,
    signUp,
    logIn,
    signInWithGoogle,
    logOut,
    sendPasswordReset,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function mapFirebaseAuthError(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Geçersiz e-posta adresi formatı.';
      case 'auth/user-disabled':
        return 'Bu kullanıcı hesabı devre dışı bırakılmış.';
      case 'auth/user-not-found':
        return 'E-posta veya şifre yanlış.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
          return 'Mevcut şifreniz yanlış. Lütfen tekrar deneyin.';
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.';
      case 'auth/weak-password':
        return 'Şifre çok zayıf. Lütfen en az 6 karakter kullanın.';
      case 'auth/requires-recent-login':
          return 'Bu hassas bir işlemdir. Lütfen tekrar giriş yapıp deneyin.';
      case 'auth/popup-closed-by-user':
          return 'Giriş penceresi kapatıldı. Lütfen tekrar deneyin.';
      case 'auth/account-exists-with-different-credential':
          return 'Bu e-posta adresiyle daha önce farklı bir yöntemle (örn: e-posta/şifre) giriş yapılmış. Lütfen o yöntemle giriş yapın.';
      default:
        return 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
  }
