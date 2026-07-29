"use client";

/* Hallmark · locked system applied · src/components/nav/account-menu.tsx
 * Avatar + name + email dropdown with a sign-out action. The sign-out posts
 * to a server action that hits supabase.auth.signOut() and redirects to /login.
 *
 * Note: DropdownMenuTrigger already renders a <button>, so we DON'T wrap it
 * in another <Button> — that produces nested buttons (invalid HTML + hydration
 * mismatch). Instead we pass the button styling directly via className.
 */

import { LogOut, UserCircle2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/actions/auth";

type AccountMenuProps = {
  email: string;
  fullName: string | null;
};

function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountMenu({ email, fullName }: AccountMenuProps) {
  const display = fullName?.trim() ? fullName : email;
  const fallback = initials(display);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Cuenta de ${display}`}
        className="inline-flex size-9 items-center justify-center rounded-full border border-transparent bg-transparent text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
            {fallback || <UserCircle2 className="size-4" aria-hidden />}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{display}</span>
          {fullName?.trim() ? (
            <span className="text-xs font-normal text-muted-foreground">
              {email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem
            render={<button type="submit" className="w-full cursor-pointer" />}
          >
            <LogOut aria-hidden />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
