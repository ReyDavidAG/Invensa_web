"use client";

// Password input with show/hide toggle. Wraps InputFormField with a trailing icon button.

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";

interface PasswordFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  autoComplete?: "current-password" | "new-password";
}

export function PasswordFormField({
  name,
  label = "Contraseña",
  description,
  autoComplete = "current-password",
}: PasswordFormFieldProps) {
  const form = useFormContext();
  const [shown, setShown] = React.useState(false);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? <FormLabel>{label}</FormLabel> : null}
          <FormControl>
            <div className="relative">
              <Input
                type={shown ? "text" : "password"}
                autoComplete={autoComplete}
                {...field}
                className="pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShown((s) => !s)}
                aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                {shown ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </Button>
            </div>
          </FormControl>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
