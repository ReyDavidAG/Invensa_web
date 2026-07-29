"use client";

import { KeyRound, Loader2, LogOut, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signOutAction } from "@/app/actions/auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function SecurityCard({ email }: { email: string }) {
  const [sendingReset, setSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    setSendingReset(true);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Te enviamos un enlace de recuperación a tu correo.");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
              <KeyRound aria-hidden className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Cambiar contraseña
              </p>
              <p className="text-xs text-muted-foreground">
                Te enviamos un enlace de recuperación a tu correo.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePasswordReset}
            disabled={sendingReset}
          >
            {sendingReset ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Mail aria-hidden className="size-4" />
                Enviar enlace
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
              <LogOut aria-hidden className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Cerrar sesión
              </p>
              <p className="text-xs text-muted-foreground">
                Cierra tu sesión en este dispositivo.
              </p>
            </div>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="destructive" size="sm">
              <LogOut aria-hidden className="size-4" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
