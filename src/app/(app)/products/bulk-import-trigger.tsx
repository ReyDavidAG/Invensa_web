"use client";

import { Upload } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BulkProductImport } from "@/components/form/bulk-product-import";

export function BulkImportTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Upload aria-hidden className="size-4" />
        Importación masiva
      </Button>
      <BulkProductImport open={open} onOpenChange={setOpen} />
    </>
  );
}
