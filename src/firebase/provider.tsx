
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import {
  getAuth,
  Auth,
  User,
  onAuthStateChanged,
  initializeAuth,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { firebaseConfig } from './config';

interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  user: User | null;
  isUserLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

type FirebaseSingleton = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

let firebaseSingleton: FirebaseSingleton | null = null;
let hasInitializedClientAuth = false;

function ensureAuthorizedDomains(auth: Auth) {
  const config = (auth.config ?? {}) as { authorizedDomains?: string[] };
  const domains = new Set(config?.authorizedDomains ?? []);
  if (firebaseConfig.authDomain) {
    try {
      const parsed = new URL(`https://${firebaseConfig.authDomain}`);
      domains.add(parsed.hostname);
    } catch (error) {
      console.warn('Unable to parse Firebase authDomain', error);
    }
  }

  if (typeof window !== 'undefined') {
    domains.add(window.location.hostname);
    if (window.location.hostname !== window.location.host) {
      const hostWithoutPort = window.location.host.replace(/:\d+$/, '');
      domains.add(hostWithoutPort);
    }
  }

  domains.add('localhost');
  domains.add('127.0.0.1');

  config.authorizedDomains = Array.from(domains).filter(Boolean);
}

export function initializeFirebase() {
  if (firebaseSingleton) {
    return firebaseSingleton;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  let authInstance: Auth;

  if (typeof window !== 'undefined') {
    if (!hasInitializedClientAuth) {
      authInstance = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        popupRedirectResolver: browserPopupRedirectResolver,
      });
      hasInitializedClientAuth = true;
    } else {
      authInstance = getAuth(app);
    }
  } else {
    authInstance = getAuth(app);
  }

  try {
    ensureAuthorizedDomains(authInstance);
  } catch (error) {
    console.warn('Unable to ensure Firebase authorized domains', error);
  }

  authInstance.useDeviceLanguage();

  const firestoreInstance = getFirestore(app);

  firebaseSingleton = {
    firebaseApp: app,
    auth: authInstance,
    firestore: firestoreInstance,
  };

  return firebaseSingleton;
}

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const { firebaseApp, auth, firestore } = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsUserLoading(false);
      },
      (error) => {
        console.error('Firebase auth subscription error', error);
        setUser(null);
        setIsUserLoading(false);
      },
    );

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

