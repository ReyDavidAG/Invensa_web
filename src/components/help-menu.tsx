"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { listTours, startTour, type Tour } from "@/lib/tour";

// Matches a tour to the current pathname. Static routes match exactly;
// dynamic routes like /products/[id] match any /products/<id>. Onboarding
// is intentionally excluded — it auto-starts on first dashboard visit and
// is not reachable via the button.
function findTourForPath(pathname: string, tours: Tour[]): Tour | undefined {
  for (const t of tours) {
    if (!t.route) continue;
    if (t.id === "onboarding") continue;
    if (t.route === pathname) return t;
    if (t.route.includes("[")) {
      const pattern = t.route.replace(/\[[^\]]+\]/g, "[^/]+");
      if (new RegExp(`^${pattern}$`).test(pathname)) return t;
    }
  }
  return undefined;
}

export function HelpMenu() {
  const pathname = usePathname();
  const tour = useMemo(
    () => findTourForPath(pathname ?? "", listTours()),
    [pathname],
  );

  // Hide the button on pages without a tour (account, reports, etc.).
  if (!tour) return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Iniciar tour de ${tour.title}`}
            data-tour="help"
            onClick={() => startTour(tour.id, { force: true })}
            className="size-9 text-muted-foreground hover:text-foreground"
          >
            <WandSparkles aria-hidden className="size-5" />
          </Button>
        }
      />
      <TooltipContent side="bottom" sideOffset={6}>
        Tour: {tour.title}
      </TooltipContent>
    </Tooltip>
  );
}