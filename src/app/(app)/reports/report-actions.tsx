"use client";

import { FileSpreadsheet, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReportActions({ period }: { period: string }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer aria-hidden className="size-3.5" />
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        render={<a href={`/api/reports/export?period=${period}`} download />}
        nativeButton={false}
      >
        <FileSpreadsheet aria-hidden className="size-3.5" />
        Excel
      </Button>
    </div>
  );
}
