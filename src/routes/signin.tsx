import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "./../components/AuthShell";
import { Input } from "./../components/ui/input";
import { Label } from "./../components/ui/label";
import { Button } from "./../components/ui/button";
import { toast, Toaster } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, redirect  } from "@tanstack/react-router";
export const Route = createFileRoute("/signin")({
  beforeLoad: async () => {
    const isLoggedIn = await Authentication();
    console.log("isLoggedIn", isLoggedIn)

    // If user already logged in → redirect away from signin
    if (isLoggedIn) {
      throw redirect({
        to: "/studio/dashboard",
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign In — EDEN" },
      { name: "description", content: "Sign in to your eden account with your phone number and password." },
      { property: "og:title", content: "Sign In — EDEN" },
      { property: "og:description", content: "Sign in to your EDEN account." },
    ],
  }),
  component: SignIn,
});

const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^254\d{9}$/, "phone_format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
async function Authentication() {
  const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_AUTHENTICATION : import.meta.env.VITE_AUTHENTICATION_LIVE}`,{
    method:"GET",
    credentials: "include",
    headers: {
      'Content-Type': 'application/json', // Indicates the body is JSON
      'x-api-key':import.meta.env.VITE_API_KEY
    },
  });  

  const {
  status,
  } = await res.json();
  return status;
}
function SignIn() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = schema.safeParse({ phone, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setLoading(false);
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    const res = await fetch(`${import.meta.env.VITE_ENVIRONMENT === "development" ? import.meta.env.VITE_SIGN_IN : import.meta.env.VITE_SIGN_IN_LIVE}`,{
      method:"POST",
      credentials: "include",
      body : JSON.stringify({
        password,
        telephone:phone
      }),
      headers: {
        'Content-Type': 'application/json', // Indicates the body is JSON
        'x-api-key':import.meta.env.VITE_API_KEY
      },
    });

    const {status, error, message} = await res.json()
    setLoading(false)
    if(error){
      toast.error('Retry: ' + error)
      return 
    }
    
    if(status){
      toast.success(message)
      toast.success("Welcome back!");
      navigate({
        to:"/studio/dashboard"
      })
    }else{
      toast.error(message)
    }

    return;
    
  }

  return (
    <AuthShell title="Sign In" subtitle="Grow Your Audience - Add Quality Films.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="phone">Telephone</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="254712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">
              Phone must start with <strong className="rounded bg-destructive/15 px-1 font-semibold">254</strong> (no +), e.g. 254712345678
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full uppercase tracking-widest"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          {loading ? "Joining The Garden..." : "Join The Garden"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/signup" className="font-semibold text-accent hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-5 border-t border-border pt-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cast &amp; crew</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Credited on a film?{" "}
          <Link to="/person/signin" className="font-semibold text-accent hover:underline">
            Person sign in
          </Link>
        </p>
      </div>
      <Toaster richColors position="top-center" />
    </AuthShell>
  );
}

