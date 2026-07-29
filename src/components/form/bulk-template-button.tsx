"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BULK_CSV_COLUMNS } from "@/lib/schemas/bulk-product";

const EXAMPLE_ROWS = [
  ["PZA-001", "Fab Ultra 1L", "Limpieza", "L", "40", "89", "12", "5"],
  ["PZA-002", "Pinol 1L", "Limpieza", "L", "35", "75", "8", "5"],
];

function buildCsv(): string {
  const lines = [
    BULK_CSV_COLUMNS.join(","),
    ...EXAMPLE_ROWS.map((row) =>
      row
        .map((cell) =>
          /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell,
        )
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export function BulkTemplateButton() {
  function handleDownload() {
    const csv = buildCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-productos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleDownload}>
      <Download aria-hidden className="size-3.5" />
      Descargar plantilla
    </Button>
  );
}
