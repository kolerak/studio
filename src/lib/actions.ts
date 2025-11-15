
"use server";

import { doc, setDoc, Timestamp } from "firebase/firestore";
import { redirect } from "next/navigation";
import { generateShortId } from "@/lib/utils";
import { getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseConfig } from "@/firebase/config";

// Store a cached instance of the Firebase Admin app
let adminApp: App | null = null;

async function initAdmin() {
  if (adminApp) {
    return adminApp;
  }
  
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  try {
    // When running in a Google Cloud environment, the SDK can automatically
    // detect the service account credentials and project ID.
    console.log("Attempting to initialize Firebase Admin with default credentials...");
    adminApp = initializeApp();
    return adminApp;
  } catch (e: any) {
    console.warn(
      `Admin initialization with default credentials failed (Code: ${e.code}, Message: ${e.message}). Falling back to project ID from config.`
    );
    try {
      console.log(`Attempting to initialize Firebase Admin with Project ID: ${firebaseConfig.projectId}`);
      adminApp = initializeApp({ projectId: firebaseConfig.projectId });
      return adminApp;
    } catch (e2: any) {
      console.error(`Firebase Admin initialization failed completely (Code: ${e2.code}, Message: ${e2.message}).`);
      // In a real app, you might throw this error to prevent the action from proceeding
      // without a valid Firebase connection.
      throw e2;
    }
  }
}

export async function createNoteAction(formData: FormData) {
  try {
    await initAdmin();
    const firestore = getFirestore();

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

    const noteRef = doc(firestore, "notes", noteId);
    await setDoc(noteRef, newNote);
    
    // This part will only be reached if setDoc is successful
    redirect(`/${noteId}`);
    
  } catch (error: any) {
    console.error("Error in createNoteAction:", error);
    // Return a structured error with code and message
    const errorMessage = `Could not create note. Code: ${error.code || 'UNKNOWN'}. Message: ${error.message || 'An unexpected error occurred.'}`;
    return { error: errorMessage };
  }
}
