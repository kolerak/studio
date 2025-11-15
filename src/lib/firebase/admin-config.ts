import { getApps } from "firebase-admin/app";

// In a real app, you would use a service account key.
// This is a placeholder to allow the server action to be structured correctly.
// The user should replace this with their actual service account credentials.
const DUMMY_SERVICE_ACCOUNT = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'your-client-email@example.com',
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || 'your-private-key').replace(/\\n/g, '\n'),
};

export async function initAdmin() {
  const apps = getApps();
  if (!apps.length) {
    try {
      const { initializeApp, cert } = await import("firebase-admin/app");
      initializeApp({
        credential: cert(DUMMY_SERVICE_ACCOUNT),
      });
    } catch (e) {
      console.error("Admin initialization failed. This may be expected on the client-side, but should work on the server. Ensure service account credentials are set.");
    }
  }
}
