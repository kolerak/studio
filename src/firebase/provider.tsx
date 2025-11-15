
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from '@/firebase';

interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const { firebaseApp, auth, firestore } = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setIsUserLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo(() => ({
    firebaseApp,
    auth,
    firestore,
    user,
    isUserLoading,
  }), [firebaseApp, auth, firestore, user, isUserLoading]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): Omit<FirebaseContextState, 'isUserLoading' | 'user'> => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.firebaseApp || !context.auth || !context.firestore) {
    throw new Error('Firebase services not available. Check FirebaseProvider setup.');
  }
  return {
    firebaseApp: context.firebaseApp,
    auth: context.auth,
    firestore: context.firestore,
  };
};

export const useAuth = (): Auth | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider.');
  }
  return context.auth;
};

export const useFirestore = (): Firestore | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider.');
  }
  return context.firestore;
};

export const useUser = (): { user: User | null; isUserLoading: boolean } => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { user: context.user, isUserLoading: context.isUserLoading };
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
