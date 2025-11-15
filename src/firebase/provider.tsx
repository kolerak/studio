
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, User, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from './config';

interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  user: User | null;
  isUserLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const authInstance = getAuth(app);

  const authorizedDomains = new Set<string>();
  const authDomain = firebaseConfig.authDomain;
  if (authDomain) {
    authorizedDomains.add(authDomain.replace(/^https?:\/\//, ""));
  }
  if (typeof window !== "undefined") {
    authorizedDomains.add(window.location.hostname);
  }
  authorizedDomains.add("localhost");
  authorizedDomains.add("127.0.0.1");

  const config = authInstance.config as { authorizedDomains?: unknown };
  if (Array.isArray(config.authorizedDomains)) {
    const mergedDomains = new Set<string>(config.authorizedDomains as string[]);
    for (const domain of authorizedDomains) {
      if (domain) {
        mergedDomains.add(domain);
      }
    }
    config.authorizedDomains = Array.from(mergedDomains);
  } else {
    config.authorizedDomains = Array.from(authorizedDomains).filter(Boolean);
  }

  const firestoreInstance = getFirestore(app);

  return {
    firebaseApp: app,
    auth: authInstance,
    firestore: firestoreInstance,
  };
}

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const { firebaseApp, auth, firestore } = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    if (!auth) return;
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
      {children}
    </FirebaseContext.Provider>
  );
};

function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.firebaseApp || !context.auth || !context.firestore) {
    throw new Error('Firebase services not available. Check FirebaseProvider setup.');
  }
  return context;
}

export const useAuth = (): Auth => useFirebase().auth;
export const useFirestore = (): Firestore => useFirebase().firestore;
export const useUser = () => {
  const { user, isUserLoading } = useFirebase();
  return { user, isUserLoading };
};

