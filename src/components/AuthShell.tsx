import type { ReactNode } from "react";
import { HomeLogo } from "./HomeLogo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <img
        src={'/home.png'}
        alt="Cinema auditorium with red velvet seats facing a glowing screen"
        width={1280}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-background/70" />
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-spotlight)" }}
      />

      <div className="relative flex w-full max-w-md flex-col items-center gap-6">
        <HomeLogo />

        <div
          className="w-full rounded-2xl border border-border bg-card p-8 backdrop-blur-xl"
          style={{ boxShadow: "var(--shadow-cinema)" }}
        >
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-accent"
              style={{ border: "1px solid var(--accent)" }}
            >
              Now Showing
            </div>
            <h1
              className="text-5xl uppercase tracking-wide text-foreground"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
