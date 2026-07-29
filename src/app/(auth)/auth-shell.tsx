// Letter macrostructure wrapper for auth pages (design.md §6.1).
// Single column, max-w-md, vertically centred. No card around the form.

import * as React from "react";
import { BrandMark } from "@/components/brand-mark";
import { FadeUp } from "@/components/motion/fade-up";
import { APP_VERSION } from "@/lib/version";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  eyebrow: string;
  heading: string;
  sub: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  heading,
  sub,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-8 sm:py-24">
      <FadeUp className={cn("w-full max-w-[420px] flex flex-col gap-8")}>
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"
              aria-hidden
            >
              <BrandMark className="size-5 text-primary-foreground" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-[-0.02em] text-foreground">
                Invensa
              </span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                v{APP_VERSION}
              </span>
            </span>
          </div>
          <div
            className="mt-1 h-1 w-10 rounded-full"
            style={{ backgroundColor: "var(--primary)" }}
            aria-hidden
          />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl">
            {heading}
          </h1>
          <p className="overflow-wrap-anywhere text-sm leading-relaxed text-muted-foreground">
            {sub}
          </p>
        </header>

        <section className="flex flex-col gap-5">{children}</section>

        {footer ? (
          <footer className="text-center text-sm text-muted-foreground">
            {footer}
          </footer>
        ) : null}
      </FadeUp>
    </main>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border-l-[3px] border-destructive bg-destructive/10 px-3.5 py-3"
    >
      <span
        aria-hidden
        className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-destructive"
      />
      <p className="text-sm font-medium leading-snug text-destructive">
        {message}
      </p>
    </div>
  );
}

export function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}
