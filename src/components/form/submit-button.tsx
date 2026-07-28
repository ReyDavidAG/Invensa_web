"use client";

// Submit button with loading and disabled states derived from react-hook-form.
// Uses the lg size (52px tall) for primary auth CTAs per design.md §7.1.

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
}

export const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  function SubmitButton(
    { loading = false, loadingLabel, children, disabled, className, ...props },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        type="submit"
        size="lg"
        disabled={disabled || loading}
        className={className}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>{loadingLabel ?? "Procesando…"}</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  },
);
