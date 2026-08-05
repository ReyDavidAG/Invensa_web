"use client";

import { useEffect, useState, type ReactNode } from "react";

// Recharts measures each chart's SVG width via ResizeObserver at mount, while
// the print view sits on-screen at its "invisible absolute inset-0" width —
// much wider than the printed page, and wider still than a single print-only
// grid column (see ReportPrintView's "Productos más vendidos" section). Left
// alone, charts print at their stale on-screen size, bleeding across columns
// or off the page edge. `beforeprint` fires after the browser has already
// applied @media print rules, so remounting the subtree there forces every
// chart underneath to re-measure at its real printed size. `display: contents`
// keeps this wrapper out of the print layout — only ReportPrintView's own
// flex/gap rules apply.
export function PrintRemount({ children }: { children: ReactNode }) {
  const [printKey, setPrintKey] = useState(0);
  useEffect(() => {
    const bump = () => setPrintKey((k) => k + 1);
    window.addEventListener("beforeprint", bump);
    return () => window.removeEventListener("beforeprint", bump);
  }, []);
  return (
    <div key={printKey} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
