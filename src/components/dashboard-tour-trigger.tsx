"use client";

import { useEffect } from "react";

import { hasCompleted } from "@/lib/tour/storage";
import { startTour } from "@/lib/tour";

// Client-only side-effect: auto-starts the onboarding tour once, 800ms
// after mount (so the dashboard layout has time to paint). Mount this
// inside the dashboard server component.
export function DashboardTourTrigger() {
  useEffect(() => {
    if (hasCompleted("onboarding")) return;
    const t = window.setTimeout(() => {
      startTour("onboarding");
    }, 800);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}