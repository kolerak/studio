import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Note } from "@/types";

const notesCollection = collection(db, "notes");

/**
 * NOTE: For automatic deletion of expired notes, a scheduled Cloud Function
 * would be needed to run periodically (e.g., daily) and delete documents
 * where `expiresAt` is in the past. This cannot be implemented in the frontend.
 *
 * Example Cloud Function:
 *
 * exports.deleteExpiredNotes = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
 *   const now = admin.firestore.Timestamp.now();
 *   const query = admin.firestore().collection('notes').where('expiresAt', '<=', now);
 *   const snapshot = await query.get();
 *   const batch = admin.firestore().batch();
 *   snapshot.docs.forEach(doc => {
 *     batch.delete(doc.ref);
 *   });
 *   return batch.commit();
 * });
 */

export async function getNote(id: string): Promise<Note | null> {
  const docRef = doc(db, "notes", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  // Simple check on the client-side
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
    return null; // Treat as not found if expired
  }

  return { id: docSnap.id, ...data } as Note;
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  const q = query(notesCollection, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const notes: Note[] = [];
  querySnapshot.forEach((doc) => {
    notes.push({ id: doc.id, ...doc.data() } as Note);
  });
  return notes.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function createNote(
  content: string,
  userId: string | null
): Promise<string> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const newNote = {
        content,
        userId,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(thirtyDaysFromNow),
    };

    // We use addDoc here and let Firestore generate the ID.
    // The prompt asked for short URLs, this is handled in the server action
    // which generates a short ID and then sets the document with that ID.
    // This function will be part of that larger action.
    const docRef = await addDoc(notesCollection, newNote);
    return docRef.id;
}
