"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { NotebookPen, LogOut, LogIn, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@/firebase";

export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been signed out securely.",
      });
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        variant: "destructive",
        title: "Sign-out failed",
        description: "We couldn't complete the sign-out. Please try again.",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const isNotesPath = pathname?.startsWith("/notes");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <NotebookPen className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">Ephemeral Notes</span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {user ? (
            <Link
              href="/notes"
              className={
                isNotesPath
                  ? "text-primary"
                  : "transition-colors hover:text-primary"
              }
            >
              My notes
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Logout
            </Button>
          ) : (
            <Button asChild size="sm" disabled={isUserLoading}>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
