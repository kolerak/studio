import type { Timestamp } from "firebase/firestore";

export interface Note {
  id: string;
  content: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  userId: string | null;
}
