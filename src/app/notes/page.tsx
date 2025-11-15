
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Note } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2, PlusCircle, ArrowRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NotesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const notesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "notes"), where("userId", "==", user.uid));
  }, [user, firestore]);
  
  const { data: notes, isLoading: notesLoading } = useCollection<Note>(notesQuery);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  };
  
  const isLoading = isUserLoading || notesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // or a message indicating redirection
  }
  
  const sortedNotes = notes?.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">My Notes</h1>
            <p className="text-muted-foreground">Here are the notes you've created.</p>
        </div>
        <Button asChild>
            <Link href="/">
                <PlusCircle className="mr-2 h-4 w-4"/>
                New Note
            </Link>
        </Button>
      </div>

      {sortedNotes && sortedNotes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No notes yet</h2>
            <p className="text-muted-foreground mt-2 mb-4">Create your first ephemeral note!</p>
            <Button asChild>
                <Link href="/">Create a Note</Link>
            </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedNotes && sortedNotes.map((note) => {
            const noteUrl = typeof window !== 'undefined' ? `${window.location.origin}/${note.id}` : '';
            return (
              <Card key={note.id}>
                <CardHeader>
                  <CardDescription>
                    Expires {formatDistanceToNow(note.expiresAt.toDate(), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-4 text-sm text-foreground/80">
                    {note.content}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(noteUrl)}>
                        <Copy className="h-4 w-4 mr-2"/>
                        Copy Link
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                        <Link href={`/${note.id}`}>
                            View Note <ArrowRight className="h-4 w-4 ml-2"/>
                        </Link>
                    </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
