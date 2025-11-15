import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import type { Note } from "@/types";


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
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, "notes", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  // Simple check on the client-side
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
    // Optionally delete the note here if you want client-side cleanup,
    // but server-side function is more reliable.
    return { id: docSnap.id, ...data, content: "This note has expired and is no longer available." } as Note;
  }

  return { id: docSnap.id, ...data } as Note;
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  const { firestore } = initializeFirebase();
  const notesCollection = collection(firestore, "notes");
  const q = query(notesCollection, where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const notes: Note[] = [];
  querySnapshot.forEach((doc) => {
    notes.push({ id: doc.id, ...doc.data() } as Note);
  });
  return notes.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}
