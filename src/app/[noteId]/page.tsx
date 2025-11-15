
"use client";

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, Timestamp } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/provider"; 
import type { Note } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { AlertCircle, Calendar, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";

type NotePageProps = {
  params: {
    noteId: string;
  };
};

// This is a temporary type definition until the types are centralized.
interface NoteWithDate extends Omit<Note, 'createdAt' | 'expiresAt'> {
  createdAt: Date;
  expiresAt: Date;
}


async function getNote(id: string): Promise<NoteWithDate | null> {
  // Note: We are initializing a temporary client here. 
  // In a real app, you'd use the one from your provider.
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, "notes", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  
  const note: NoteWithDate = {
    id: docSnap.id,
    content: data.content,
    userId: data.userId,
    createdAt: (data.createdAt as Timestamp).toDate(),
    expiresAt: (data.expiresAt as Timestamp).toDate(),
  };

  return note;
}


export default function NotePage({ params }: NotePageProps) {
  const [note, setNote] = useState<NoteWithDate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const fetchedNote = await getNote(params.noteId);
        if (!fetchedNote) {
          notFound();
          return;
        }
        setNote(fetchedNote);
      } catch (err: any) {
        setError("Failed to load note.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [params.noteId]);


  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
     return (
      <div className="container flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline text-destructive">
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-xl font-semibold">Failed to load note</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!note) {
    return null; // notFound() is called in useEffect
  }
  
  const isExpired = note.expiresAt < new Date();

  return (
    <div className="container flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">
            An Ephemeral Note
          </CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Created on {format(note.createdAt, "PPP")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>
                {isExpired
                  ? "Expired"
                  : `Expires ${formatDistanceToNow(note.expiresAt, {
                      addSuffix: true,
                    })}`}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isExpired ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/50 rounded-lg">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-xl font-semibold">This note has expired</h3>
              <p className="text-muted-foreground">The content of this note is no longer available.</p>
            </div>
          ) : (
            <div className="prose prose-stone dark:prose-invert max-w-none whitespace-pre-wrap break-words rounded-lg border bg-background p-6 text-base font-mono">
              {note.content}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
