"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// ponytail: defer real PWA install analytics + dismissal persistence to V2.
// For now: button appears when Chrome fires beforeinstallprompt, vanishes
// after user accepts/dismisses (we hold a local flag). Re-show after a
// reload or a successful install (the prompt won't re-fire naturally).
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPwaButton() {
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Register the SW so Chrome offers install. SW is install-only (no
    // offline cache) — see public/sw.js.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent: install button just won't appear if SW fails.
      });
    }

    const onBIP = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !bip) return null;

  async function handleClick() {
    if (!bip) return;
    await bip.prompt();
    const choice = await bip.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setBip(null); // prompt is single-use per event
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        onClick={handleClick}
        tooltip="Instalar app"
        className="data-[active=true]:border-l-2 data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary group-data-[collapsible=icon]:data-[active=true]:border-l-0 group-data-[collapsible=icon]:data-[active=true]:bg-primary group-data-[collapsible=icon]:data-[active=true]:text-primary-foreground [&_svg]:size-5 [&>span:last-child]:group-data-[collapsible=icon]:hidden"
      >
        <Smartphone aria-hidden />
        <span className="inline-flex items-center gap-2 text-sm">
          Instalar app
          <Download
            aria-hidden
            className="size-3.5 text-muted-foreground"
          />
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}