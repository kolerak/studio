"use server";

import { doc, setDoc, Timestamp } from "firebase/firestore";
import { redirect } from "next/navigation";
import { generateShortId } from "@/lib/utils";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseConfig } from "@/firebase/config";

async function initAdmin() {
  if (getApps().length > 0) {
    return;
  }
  // When running in a Google Cloud environment, the SDK can automatically
  // detect the service account credentials and project ID.
  try {
    initializeApp();
  } catch (e) {
    console.warn(
      'Admin initialization with default credentials failed. Falling back to project ID. Error:',
      e
    );
    try {
      initializeApp({ projectId: firebaseConfig.projectId });
    } catch (e2) {
      console.error('Admin initialization failed completely. Error:', e2);
      throw e2;
    }
  }
}

export async function createNoteAction(formData: FormData) {
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

  try {
    const noteRef = doc(firestore, "notes", noteId);
    await setDoc(noteRef, newNote);
  } catch (error) {
    console.error("Error creating note:", error);
    return { error: "Could not create note. Please try again." };
  }

  redirect(`/${noteId}`);
}
