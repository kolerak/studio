
"use server";

import { redirect } from "next/navigation";
import { generateShortId } from "@/lib/utils";
import { getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { firebaseConfig } from "@/firebase/config";

// Store a cached instance of the Firebase Admin app
let adminApp: App | null = null;

function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export async function createNoteAction(formData: FormData) {
  try {
    initAdmin();
    // Use the Admin SDK's getFirestore instance
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
      // Use the Admin SDK's Timestamp
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(thirtyDaysFromNow),
    };

    // Use the Admin SDK's method to get a document reference and set it
    const noteRef = firestore.collection("notes").doc(noteId);
    await noteRef.set(newNote);
    
    // This part will only be reached if setDoc is successful
    redirect(`/${noteId}`);
    
  } catch (error: any) {
    console.error("Note Creation Error:", error);
    // Return a structured error with code and message
    const errorMessage = `Could not create note. Code: ${error.code || 'UNKNOWN'}. Message: ${error.message || 'An unexpected error occurred.'}`;
    return { error: errorMessage };
  }
}
