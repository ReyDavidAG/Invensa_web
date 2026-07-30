import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, ShieldCheck, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FadeUp } from "@/components/motion/fade-up";
import { getSupabaseServer } from "@/lib/supabase/server";

import { ProfileForm } from "./profile-form";
import { SecurityCard } from "./security-card";

export const metadata: Metadata = {
  title: "Cuenta",
};

export const dynamic = "force-dynamic";

const esMXLongDate = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const ROLE_META = {
  admin: {
    label: "Admin",
    className: "bg-primary/15 text-primary",
  },
  employee: {
    label: "Empleado",
    className: "bg-secondary text-secondary-foreground",
  },
} as const;

function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AccountPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) notFound();

  const fullName = (profile.full_name ?? "").trim() || (user.email ?? "");
  const role =
    (profile.role as keyof typeof ROLE_META) in ROLE_META
      ? (profile.role as keyof typeof ROLE_META)
      : "employee";
  const memberSince = esMXLongDate.format(new Date(profile.created_at));
  const roleMeta = ROLE_META[role];

  return (
    <FadeUp className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-3.5" />
          Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
          Cuenta
        </h1>
      </div>

      <div aria-hidden className="h-1 w-12 rounded-full bg-primary" />

      {/* Profile card */}
      <Card className="card-hover-lift" data-tour="account-profile">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary/15 text-primary text-xl font-semibold">
                {initials(fullName) || <User aria-hidden className="size-6" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-semibold tracking-tight text-foreground">
                {fullName}
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail aria-hidden className="size-3.5" />
                {profile.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={roleMeta.className}>{roleMeta.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  Miembro desde {memberSince}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit name form */}
      <div data-tour="account-edit-name">
        <ProfileForm
          fullName={profile.full_name ?? ""}
          email={profile.email ?? ""}
        />
      </div>

      {/* Security card */}
      <Card>
        <CardContent className="flex items-center gap-3 p-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
            <ShieldCheck aria-hidden className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Seguridad</p>
            <p className="text-xs text-muted-foreground">
              Contraseña y sesión activa.
            </p>
          </div>
        </CardContent>
      </Card>

      <div data-tour="account-password">
        <SecurityCard email={profile.email ?? ""} />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        ¿Algo raro con tu cuenta? Avísale a la hermana con el ID{" "}
        <span className="font-mono tabular-nums">{profile.id.slice(0, 8)}</span>
        .
      </p>
    </FadeUp>
  );
}
