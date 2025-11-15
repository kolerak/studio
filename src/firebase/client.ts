
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// This file centralizes Firebase client-side initialization.
// It is imported by the FirebaseProvider and other client-side components.

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// Check if Firebase has already been initialized
if (getApps().length === 0) {
  try {
    // Attempt initialization using App Hosting's automatic config
    app = initializeApp();
  } catch (error) {
    console.warn("Automatic Firebase initialization failed, falling back to firebaseConfig. This is normal in local development.", error);
    // Fallback to the hardcoded config for local development
    app = initializeApp(firebaseConfig);
  }
} else {
  // If already initialized, get the existing app
  app = getApp();
}

// Get the Auth and Firestore services
auth = getAuth(app);
firestore = getFirestore(app);

// Export the initialized services
export { app, auth, firestore };
