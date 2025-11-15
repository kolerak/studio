"use server";

import { doc, setDoc, Timestamp } from "firebase/firestore";
import { redirect } from "next/navigation";
import { generateShortId } from "@/lib/utils";
import { getApps } from "firebase-admin/app";
import { initAdmin } from "./firebase/admin-config";
import { initializeFirebase } from "@/firebase";

async function getUserId() {
  try {
    await initAdmin();
    // This part is tricky without a session management library like next-auth
    // For a server action, we don't have direct access to client-side auth state.
    // A proper implementation would pass an ID token from the client to the server action
    // and verify it here. For this example, we'll assume a simplified scenario where
    // userId is passed directly, or we handle anonymous notes.
    // This part of the code is illustrative of where user ID would be handled.
    return null; // Placeholder
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function createNoteAction(formData: FormData) {
  const content = formData.get("content") as string;
  const userId = formData.get("userId") as string | null;
  const { firestore } = initializeFirebase();

  if (!content || content.trim().length === 0) {
    return { error: "Note content cannot be empty." };
  }
  if (content.length > 10000) {
    return { error: "Note is too long." };
  }
  
  let noteId = generateShortId();

  // A more robust solution would check for ID collisions
  // For this app, the chance is low enough to proceed.

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const newNote = {
    content,
    userId: userId || null,
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
