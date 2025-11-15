"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import {
  Loader2,
  Send,
  LogIn,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  StickyNote,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore } from "@/firebase";
import { generateShortId } from "@/lib/utils";

const MAX_NOTE_LENGTH = 5000;

export default function Home() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [content, setContent] = React.useState("");
  const [charCount, setCharCount] = React.useState(0);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const remainingCharacters = MAX_NOTE_LENGTH - charCount;
  const nearCharacterLimit = remainingCharacters <= 200;

  const resetForm = () => {
    setContent("");
    setCharCount(0);
    setValidationError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to create a note.",
      });
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setValidationError("Note content cannot be empty.");
      toast({
        variant: "destructive",
        title: "Add some content",
        description: "Write a message before creating your note.",
      });
      return;
    }

    if (trimmedContent.length > MAX_NOTE_LENGTH) {
      setValidationError("Your note is too long. Please shorten it and try again.");
      toast({
        variant: "destructive",
        title: "Note too long",
        description: `Notes are limited to ${MAX_NOTE_LENGTH.toLocaleString()} characters for security.`,
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const noteId = generateShortId();
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

          await setDoc(doc(firestore, "notes", noteId), {
            content: trimmedContent,
            userId: user.uid,
            createdAt: Timestamp.now(),
            expiresAt: Timestamp.fromDate(thirtyDaysFromNow),
          });

          toast({
            title: "Note created",
            description: "We saved your note and will redirect you to your list shortly.",
          });

          resetForm();
          router.push("/notes");
        } catch (error) {
          console.error("Note Creation Error:", error);
          const firebaseError = error as FirebaseError;
          const code = firebaseError?.code ?? "unknown";
          const message =
            firebaseError?.message?.replace("Firebase: ", "").replace(/ \(auth\/.+\)$/i, "") ??
            "An unexpected error occurred.";

          toast({
            variant: "destructive",
            title: "Error creating note",
            description: `Code: ${code}.\nMessage: ${message}`,
          });
        }
      })();
    });
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setContent(value);
    setCharCount(value.length);
    if (validationError) {
      setValidationError(null);
    }
  };

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-background" aria-hidden />
      <div className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl" aria-hidden />

      <div className="relative container flex min-h-[calc(100vh-3.5rem)] flex-col justify-center gap-12 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Secure self-destructing notes
            </div>
            <div className="space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Share secrets confidently. Your note disappears in 30 days.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Ephemeral Notes makes it easy to capture sensitive information, share it once, and rest easy knowing it will
                vanish on schedule. No inbox clutter, no lingering files—just peace of mind.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <Button asChild size="lg" variant="default" className="shadow-lg shadow-primary/30">
                  <Link href="/notes">
                    <StickyNote className="mr-2 h-5 w-5" />
                    View my notes
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="shadow-lg shadow-primary/30">
                  <Link href="/login">
                    <LogIn className="mr-2 h-5 w-5" />
                    Login or register
                  </Link>
                </Button>
              )}

              <Badge variant="outline" className="border-primary/40 bg-background/80 text-sm">
                <Share2 className="mr-2 h-3.5 w-3.5 text-primary" /> Share a note in seconds
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<ShieldCheck className="h-5 w-5 text-primary" />}
                title="Private by design"
                description="Notes live securely in Firestore and are only visible to you."
              />
              <FeatureCard
                icon={<Clock className="h-5 w-5 text-primary" />}
                title="Automatic cleanup"
                description="Every note is scheduled for deletion after 30 days."
              />
            </div>
          </div>

          <Card className="border border-primary/20 bg-background/95 shadow-2xl shadow-primary/20 backdrop-blur">
            <form onSubmit={handleSubmit} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>Create a secure note</CardTitle>
                <CardDescription>
                  {user
                    ? "Your note will be linked to your account and removed automatically after 30 days."
                    : "Sign in to compose and save private, self-destructing notes."}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {isUserLoading ? (
                  <div className="flex h-60 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : user ? (
                  <>
                    <Textarea
                      name="content"
                      placeholder="Write something that should disappear..."
                      className="min-h-[220px] resize-none text-base"
                      value={content}
                      onChange={handleContentChange}
                      maxLength={MAX_NOTE_LENGTH}
                      disabled={isPending}
                      aria-invalid={Boolean(validationError)}
                      aria-describedby={validationError ? "note-content-error" : undefined}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className={nearCharacterLimit ? "font-medium text-primary" : undefined}>
                        {remainingCharacters.toLocaleString()} characters remaining
                      </span>
                      <span>Expires automatically on {formatExpiryPreview()}</span>
                    </div>
                    {validationError ? (
                      <p id="note-content-error" className="text-sm text-destructive">
                        {validationError}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div className="flex h-60 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/30 bg-muted/50 p-6 text-center">
                    <StickyNote className="h-8 w-8 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Login or create an account to start writing secure, ephemeral notes.
                    </p>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Go to login
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>

              <Separator className="mx-6" />

              <CardFooter className="mt-auto flex flex-col gap-3">
                <Button type="submit" disabled={isPending || !user} className="w-full">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Create note
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Notes are encrypted in transit and scheduled for deletion after 30 days. You can still manually delete them at
                  any time from the notes dashboard.
                </p>
              </CardFooter>
            </form>
          </Card>
        </section>

        <section className="grid gap-6 rounded-3xl border border-primary/20 bg-background/80 p-8 shadow-xl shadow-primary/10 backdrop-blur lg:grid-cols-3">
          <ValueCard
            icon={<StickyNote className="h-5 w-5 text-primary" />}
            title="Compose fast"
            description="Create a note in seconds with autosave-friendly inputs and an intuitive interface."
          />
          <ValueCard
            icon={<Share2 className="h-5 w-5 text-primary" />}
            title="Share securely"
            description="Copy a private link to share with confidence. You stay in control of what you share."
          />
          <ValueCard
            icon={<ArrowRight className="h-5 w-5 text-primary" />}
            title="Stay in flow"
            description="We redirect you to your notes instantly after creation so you can manage or share right away."
          />
        </section>
      </div>
    </div>
  );

  function formatExpiryPreview() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    return expiry.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-background/90 p-4 shadow-sm backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">{icon}</div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-background/90 p-5 shadow-sm backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">{icon}</div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
