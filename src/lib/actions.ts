
"use server";

import { redirect } from "next/navigation";
import { generateShortId } from "@/lib/utils";
import { getApps, initializeApp, App, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// This is a simplified and more robust way to initialize the Firebase Admin SDK.
// It checks if the app is already initialized, and if not, it initializes it.
function initAdmin(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  // Instead of using the client-side config, we check for the server-side
  // environment variable that Firebase App Hosting provides.
  if (process.env.FIREBASE_CONFIG) {
     return initializeApp();
  }

  // Fallback for local development if GOOGLE_APPLICATION_CREDENTIALS is set
  // This requires a service account key file.
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!);
    return initializeApp({
        credential: cert(serviceAccount),
    });
  } catch (e) {
    console.error("Firebase Admin SDK initialization failed.", e);
    throw new Error("Could not initialize Firebase Admin SDK. Make sure GOOGLE_APPLICATION_CREDENTIALS is set correctly for local development.");
  }
}

export async function createNoteAction(formData: FormData) {
  try {
    const app = initAdmin();
    const firestore = getFirestore(app);

    const content = formData.get("content") as string;
    const userId = formData.get("userId") as string | null;

    if (!content || content.trim().length === 0) {
      return { error: "Note content cannot be empty." };
    }
    if (content.length > 10000) {
      return { error: "Note is too long." };
    }
    
    if (!userId) {
      return { error: "You must be logged in to create a note." };
    }

    const noteId = generateShortId();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const newNote = {
      content,
      userId: userId,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(thirtyDaysFromNow),
    };

    const noteRef = firestore.collection("notes").doc(noteId);
    await noteRef.set(newNote);
    
  } catch (error: any) {
    console.error("Note Creation Error:", error);
    return { error: `Could not create note. Error: ${error.message}` };
  }

  // Redirect must be called outside of the try-catch block
  redirect(`/notes`);
}
