import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "./../../components/AuthShell";
import { Input } from "./../../components/ui/input";
import { Label } from "./../../components/ui/label";
import { Button } from "./../../components/ui/button";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/person/signin")({
  beforeLoad: async () => {
    const isLoggedIn = await PersonAuthentication();

    if (isLoggedIn) {
      throw redirect({
        to: "/person/dashboard",
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Person Sign In — EDEN" },
      { name: "description", content: "Cast and crew sign in to the EDEN person dashboard with the email their studio registered." },
      { property: "og:title", content: "Person Sign In — EDEN" },
      { property: "og:description", content: "Sign in to your EDEN person profile." },
    ],
  }),
  component: PersonSignIn,
});

const emailSchema = z.object({
  email: z.string().trim().email("Insert the email your studio registered"),
});

const codeSchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, "The code is 6 digits"),
});

export async function PersonAuthentication() {
  try {
    const res = await fetch(
      `${
        import.meta.env.VITE_ENVIRONMENT === "development"
          ? import.meta.env.VITE_PERSON_AUTHENTICATION
          : import.meta.env.VITE_PERSON_AUTHENTICATION_LIVE
      }`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_API_KEY,
        },
      },
    );

    const { status } = await res.json();
    return Boolean(status);
  } catch {
    return false;
  }
}

function PersonSignIn() {
  //two steps on one card - ask for the email, then for the code mailed to it
  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setErrors({ email: result.error.issues[0].message });
      setLoading(false);
      return;
    }
    setErrors({});

    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_ENVIRONMENT === "development"
            ? import.meta.env.VITE_PERSON_SIGN_IN
            : import.meta.env.VITE_PERSON_SIGN_IN_LIVE
        }`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ email }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.VITE_API_KEY,
          },
        },
      );

      const { status, message, error } = await res.json();
      setLoading(false);

      if (error) {
        toast.error("Retry: " + error);
        return;
      }

      if (status) {
        toast.success(message);
        setStage("code");
        return;
      }

      toast.error(message);
    } catch (error) {
      setLoading(false);
      toast.error("Could not reach the garden. Try again later.");
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = codeSchema.safeParse({ otp });
    if (!result.success) {
      setErrors({ otp: result.error.issues[0].message });
      setLoading(false);
      return;
    }
    setErrors({});

    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_ENVIRONMENT === "development"
            ? import.meta.env.VITE_PERSON_SIGN_IN_CONFIRM
            : import.meta.env.VITE_PERSON_SIGN_IN_CONFIRM_LIVE
        }`,
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ email, otp }),
          headers: {
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.VITE_API_KEY,
          },
        },
      );

      const { status, message, error } = await res.json();
      setLoading(false);

      if (error) {
        toast.error("Retry: " + error);
        return;
      }

      if (status) {
        toast.success("Welcome back to the credits.");
        navigate({ to: "/person/dashboard" });
        return;
      }

      toast.error(message);
    } catch (error) {
      setLoading(false);
      toast.error("Could not reach the garden. Try again later.");
    }
  }

  return (
    <AuthShell title="Person" subtitle="Cast & Crew - Own Your Credits.">
      {stage === "email" ? (
        <form onSubmit={requestCode} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="actor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use the address the studio registered on your person profile. We mail you a one time code.
            </p>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full uppercase tracking-widest"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            {loading ? "Sending The Code..." : "Send Sign In Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={confirmCode} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="otp">Sign in code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Sent to {email}. Expires in 10 minutes.</p>
            {errors.otp && <p className="text-xs text-destructive">{errors.otp}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full uppercase tracking-widest"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            {loading ? "Checking The Code..." : "Enter The Garden"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStage("email");
              setOtp("");
            }}
            className="w-full text-center text-sm text-muted-foreground hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Run a studio instead?{" "}
        <Link to="/signin" className="font-semibold text-accent hover:underline">
          Studio sign in
        </Link>
      </p>
      <Toaster richColors position="top-center" />
    </AuthShell>
  );
}
