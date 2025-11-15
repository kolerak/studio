import { getNote } from "@/lib/firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { AlertCircle, Calendar, Clock } from "lucide-react";

type NotePageProps = {
  params: {
    noteId: string;
  };
};

export default async function NotePage({ params }: NotePageProps) {
  const note = await getNote(params.noteId);

  if (!note) {
    notFound();
  }

  const isExpired = note.expiresAt.toDate() < new Date();

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
              <span>Created on {format(note.createdAt.toDate(), "PPP")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>
                {isExpired
                  ? "Expired"
                  : `Expires ${formatDistanceToNow(note.expiresAt.toDate(), {
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
