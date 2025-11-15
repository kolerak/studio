"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  AuthErrorCodes,
  UserCredential,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const MIN_PASSWORD_LENGTH = 6;
const OPERATION_NOT_SUPPORTED_CODE = "auth/operation-not-supported-in-this-environment";

const googleIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="20"
    height="20"
    aria-hidden
    focusable="false"
    className="mr-2"
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12  c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20  s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657  C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946  l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,36.37,44,30.651,44,24  C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

type AuthMode = "login" | "register";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [loadingState, setLoadingState] = useState<AuthMode | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [handlingRedirect, setHandlingRedirect] = useState(true);

  const submitButtonLabel = useMemo(
    () => (activeTab === "login" ? "Sign In" : "Create Account"),
    [activeTab],
  );

  useEffect(() => {
    if (!auth) {
      return;
    }

    let isMounted = true;

    getRedirectResult(auth)
      .then((result) => {
        if (!isMounted) {
          return;
        }

        if (result) {
          handleSuccessfulAuth(result, "Google sign-in successful! Welcome back.");
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        const firebaseError = error as FirebaseError;
        if (firebaseError?.code && firebaseError.code !== "auth/no-auth-event") {
          reportAuthError("Google Sign-In Error", firebaseError);
        }
      })
      .finally(() => {
        if (isMounted) {
          setHandlingRedirect(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [auth]);

  const validateCredentials = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const reportAuthError = (title: string, error: FirebaseError) => {
    console.error(title, error);

    const code = error?.code ?? "unknown";
    const message = error?.message?.replace("Firebase: ", "").replace(/ \(auth\/.+\)$/i, "") ?? "An unexpected error occurred.";

    toast({
      variant: "destructive",
      title,
      description: `Code: ${code}.\nMessage: ${message}`,
    });
  };

  const handleSuccessfulAuth = (credential: UserCredential, message?: string) => {
    toast({
      title: message ?? "You're signed in!",
      description: credential.user.displayName
        ? `Welcome, ${credential.user.displayName}!`
        : "Redirecting you to your notes...",
    });
    router.push("/notes");
  };

  const handleAuth = async (mode: AuthMode) => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Firebase Auth is not available. Please refresh and try again.",
      });
      return;
    }

    if (!validateCredentials()) {
      toast({
        variant: "destructive",
        title: "Check your details",
        description: "Please resolve the highlighted fields and try again.",
      });
      return;
    }

    setLoadingState(mode);

    try {
      const trimmedEmail = email.trim();
      let result: UserCredential;

      if (mode === "register") {
        result = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        handleSuccessfulAuth(result, "Account created successfully!");
      } else {
        result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        handleSuccessfulAuth(result, "Welcome back!");
      }
    } catch (error) {
      reportAuthError(mode === "register" ? "Registration Error" : "Login Error", error as FirebaseError);
    } finally {
      setLoadingState(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Firebase Auth is not available. Please refresh and try again.",
      });
      return;
    }

    setLoadingGoogle(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      handleSuccessfulAuth(result, "Google sign-in successful! Welcome back.");
    } catch (error) {
      const firebaseError = error as FirebaseError;

      if (
        firebaseError?.code === AuthErrorCodes.POPUP_BLOCKED ||
        firebaseError?.code === OPERATION_NOT_SUPPORTED_CODE
      ) {
        toast({
          title: "Opening secure redirect",
          description: "Your browser blocked the popup, so we'll continue in a new tab.",
        });
        const redirectProvider = new GoogleAuthProvider();
        redirectProvider.setCustomParameters({ prompt: "select_account" });
        await signInWithRedirect(auth, redirectProvider);
        return;
      }

      if (firebaseError?.code === AuthErrorCodes.POPUP_CLOSED_BY_USER) {
        toast({
          variant: "destructive",
          title: "Google sign-in canceled",
          description: "The popup was closed before completing authentication. Please try again.",
        });
        return;
      }

      if (firebaseError?.code === "auth/unauthorized-domain") {
        toast({
          variant: "destructive",
          title: "Domain not authorized",
          description: "Add your current domain to the Firebase console's authorized domains list and try again.",
        });
      } else {
        reportAuthError("Google Sign-In Error", firebaseError);
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const isBusy = loadingState !== null || loadingGoogle || handlingRedirect;

  return (
    <div className="relative isolate min-h-[calc(100vh-3.5rem)] overflow-hidden bg-gradient-to-br from-background via-primary/10 to-background">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top,_rgba(115,109,171,0.25),_transparent_55%)]" aria-hidden />
      <div className="pointer-events-none absolute -top-48 right-1/2 h-96 w-96 translate-x-1/2 rounded-full bg-primary/30 blur-3xl" aria-hidden />

      <div className="relative container grid items-center gap-10 py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Effortless, secure note sharing
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Sign in to keep your notes ephemeral
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Access your self-destructing notes, collaborate securely, and share information that automatically disappears after 30 days.
          </p>
          <dl className="mt-8 grid gap-6 text-left sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-background/80 p-4 shadow-sm backdrop-blur">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <div>
                <dt className="font-semibold text-foreground">Secure by default</dt>
                <dd className="text-sm text-muted-foreground">Authentication and data encryption keep every note private to you.</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-background/80 p-4 shadow-sm backdrop-blur">
              <Clock className="mt-1 h-5 w-5 text-primary" />
              <div>
                <dt className="font-semibold text-foreground">Automatic expiry</dt>
                <dd className="text-sm text-muted-foreground">Each note self-destructs after 30 days so you never have to clean up.</dd>
              </div>
            </div>
          </dl>
        </div>

        <Card className="mx-auto w-full max-w-md border-border/60 bg-background/95 shadow-2xl backdrop-blur">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as AuthMode);
              setFormErrors({});
            }}
            className="w-full"
          >
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login" className="space-y-6">
              <CardHeader className="space-y-2 pb-0">
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to revisit and manage your ephemeral notes.</CardDescription>
              </CardHeader>
              <AuthForm
                idPrefix="login"
                email={email}
                password={password}
                formErrors={formErrors}
                setEmail={setEmail}
                setPassword={setPassword}
              />
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <CardHeader className="space-y-2 pb-0">
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Register to start sharing notes that automatically expire.</CardDescription>
              </CardHeader>
              <AuthForm
                idPrefix="register"
                email={email}
                password={password}
                formErrors={formErrors}
                setEmail={setEmail}
                setPassword={setPassword}
              />
              <div className="-mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                Passwords must be at least {MIN_PASSWORD_LENGTH} characters to keep your account secure.
              </div>
            </TabsContent>
          </Tabs>

          <CardContent className="space-y-4 pt-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => handleAuth(activeTab)}
              disabled={isBusy}
            >
              {loadingState ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              {submitButtonLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isBusy}
            >
              {loadingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : googleIcon}
              {loadingGoogle ? "Contacting Google..." : "Continue with Google"}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col items-stretch gap-3 text-center text-xs text-muted-foreground">
            <p>
              By continuing you agree to our private note policy. We only store your notes for 30 days and never share your
              information.
            </p>
            {isBusy ? (
              <div className="flex items-center justify-center gap-2 text-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-primary" aria-hidden />
                {handlingRedirect ? "Checking previous sign-in status..." : "Working on it..."}
              </div>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </div>
  );

  function AuthForm({
    idPrefix,
    email,
    password,
    formErrors,
    setEmail,
    setPassword,
  }: {
    idPrefix: string;
    email: string;
    password: string;
    formErrors: { email?: string; password?: string };
    setEmail: (value: string) => void;
    setPassword: (value: string) => void;
  }) {
    const emailId = `${idPrefix}-auth-email`;
    const passwordId = `${idPrefix}-auth-password`;

    return (
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <Label htmlFor={emailId}>Email</Label>
          <Input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(formErrors.email)}
            aria-describedby={formErrors.email ? `${emailId}-error` : undefined}
          />
          {formErrors.email ? (
            <p id={`${emailId}-error`} className="text-xs text-destructive">
              {formErrors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={passwordId}>Password</Label>
          <Input
            id={passwordId}
            type="password"
            autoComplete={activeTab === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(formErrors.password)}
            aria-describedby={formErrors.password ? `${passwordId}-error` : undefined}
          />
          {formErrors.password ? (
            <p id={`${passwordId}-error`} className="text-xs text-destructive">
              {formErrors.password}
            </p>
          ) : null}
        </div>
      </CardContent>
    );
  }
}
