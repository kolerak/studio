
"use server";

import { redirect } from "next/navigation";
import { generateShortId } from "@/lib/utils";
import { getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { firebaseConfig } from "@/firebase/config";

// Initialize Firebase Admin SDK
function initAdmin(): App {
  if (getApps().length) {
    return getApps()[0];
  }
  return initializeApp({ projectId: firebaseConfig.projectId });
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
    return { error: `Could not create note. Code: ${error.code}. Message: ${error.message}` };
  }

  // Redirect must be called outside of the try-catch block
  redirect(`/notes`);
}
