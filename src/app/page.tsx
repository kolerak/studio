"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createNoteAction } from "@/lib/actions";
import { useUser } from "@/firebase";
import React from "react";
import { Loader2, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    if (user) {
      formData.set("userId", user.uid);
    }
    
    startTransition(async () => {
      const result = await createNoteAction(formData);
      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        // Redirect is handled by the server action
        formRef.current?.reset();
      }
    });
  };

  return (
    <div className="container relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl font-headline">
                Ephemeral Notes
            </h1>
            <p className="max-w-xl mx-auto text-lg text-muted-foreground">
                Jot down your thoughts. Share a secret. Your note will self-destruct in 30 days.
            </p>
        </div>

        <Card className="shadow-2xl shadow-primary/10">
          <form onSubmit={handleSubmit} ref={formRef}>
            <CardHeader>
                <CardTitle>New Note</CardTitle>
                <CardDescription>
                    {user ? "Your note will be linked to your account." : "Sign in to keep track of your notes."}
                </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                name="content"
                placeholder="Write something that will disappear..."
                className="min-h-[200px] text-base resize-none"
                required
                disabled={isPending}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create Note
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
