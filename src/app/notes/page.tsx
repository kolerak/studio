"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Loader2, PlusCircle, ArrowRight, Copy, CalendarClock } from "lucide-react";

import { useUser, useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { Note } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function NotesPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const copyResetTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const notesQuery = useMemo(() => {
    if (!user) {
      return null;
    }
    return query(collection(firestore, "notes"), where("userId", "==", user.uid));
  }, [user, firestore]);

  const {
    data: notes,
    isLoading: notesLoading,
    error,
  } = useCollection<Note>(notesQuery);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Unable to load notes",
        description: `Code: ${error.code}. Message: ${error.message}`,
      });
    }
  }, [error, toast]);

  const isLoading = isUserLoading || notesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sortedNotes = useMemo(() => {
    if (!notes) {
      return [] as ReturnType<typeof enhanceNote>[];
    }

    return notes
      .slice()
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .map(enhanceNote);
  }, [notes]);

  const noteCount = sortedNotes.length;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopyLink = async (noteId: string, noteUrl: string) => {
    try {
      await navigator.clipboard.writeText(noteUrl);
      setCopiedNoteId(noteId);
      toast({
        title: "Link copied",
        description: "Share this note securely with anyone you trust.",
      });
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current);
      }
      copyResetTimeout.current = setTimeout(() => {
        setCopiedNoteId((current) => (current === noteId ? null : current));
        copyResetTimeout.current = null;
      }, 2000);
    } catch (copyError) {
      console.error("Clipboard copy failed", copyError);
      toast({
        variant: "destructive",
        title: "Couldn't copy link",
        description: "Your browser blocked clipboard access. Try copying manually instead.",
      });
    }
  };

  return (
    <div className="relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(115,109,171,0.25),_transparent_70%)]" aria-hidden />

      <div className="relative container flex flex-col gap-12 py-14">
        <header className="flex flex-col gap-6 rounded-3xl border border-primary/20 bg-background/80 p-8 shadow-xl shadow-primary/10 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 text-primary">
              <CalendarClock className="mr-2 h-3.5 w-3.5" /> {noteCount} {noteCount === 1 ? "active note" : "active notes"}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">My ephemeral notes</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Every note automatically expires after 30 days. Create new notes whenever you need to share information securely and
              temporarily.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/">
                <PlusCircle className="mr-2 h-4 w-4" /> Create new note
              </Link>
            </Button>
            <Button variant="secondary" onClick={() => router.refresh()}>
              Refresh
            </Button>
          </div>
        </header>

        {sortedNotes.length === 0 ? (
          <Card className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 border border-dashed border-primary/30 bg-background/70 p-12 text-center shadow-lg shadow-primary/10">
            <StickyNoteEmptyState />
            <CardTitle className="text-2xl">You're all caught up</CardTitle>
            <CardDescription className="max-w-xl text-base">
              You don't have any active notes yet. Create one to generate a private link that will self-destruct in 30 days.
            </CardDescription>
            <Button asChild size="lg">
              <Link href="/">
                <PlusCircle className="mr-2 h-4 w-4" /> Create your first note
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sortedNotes.map((note) => {
              const noteUrl = baseUrl ? `${baseUrl}/${note.id}` : `/${note.id}`;
              const isCopied = copiedNoteId === note.id;

              return (
                <Card key={note.id} className="flex h-full flex-col border border-primary/20 bg-background/80 shadow-lg shadow-primary/10 backdrop-blur">
                  <CardHeader>
                    <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                      Created {note.createdAtLabel}
                    </CardDescription>
                    <CardTitle className="text-lg">Expires {note.expiresAtLabel}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="line-clamp-5 whitespace-pre-line text-sm text-foreground/80">{note.content}</p>
                  </CardContent>
                  <Separator className="mx-6" />
                  <CardFooter className="flex flex-col gap-3 p-6">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleCopyLink(note.id, noteUrl)}>
                      <Copy className="mr-2 h-4 w-4" /> {isCopied ? "Copied!" : "Copy share link"}
                    </Button>
                    <Button asChild variant="secondary" size="sm" className="w-full">
                      <Link href={`/${note.id}`}>
                        View note <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function enhanceNote(note: Note & { id: string }) {
  const createdAtDate = note.createdAt.toDate();
  const expiresAtDate = note.expiresAt.toDate();

  return {
    ...note,
    createdAtLabel: formatDistanceToNow(createdAtDate, { addSuffix: true }),
    expiresAtLabel: formatDistanceToNow(expiresAtDate, { addSuffix: true }),
  };
}

function StickyNoteEmptyState() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-7 w-7 text-primary"
        aria-hidden
      >
        <path d="M7 3h10a2 2 0 0 1 2 2v9.586a2 2 0 0 1-.586 1.414l-3.414 3.414A2 2 0 0 1 13.586 20H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 20v-4a2 2 0 0 1 2-2h4" />
      </svg>
    </div>
  );
}
