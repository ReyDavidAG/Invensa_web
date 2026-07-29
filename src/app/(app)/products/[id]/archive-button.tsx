"use client";

/* Hallmark · locked system applied · src/app/(app)/products/[id]/archive-button.tsx
 * Soft-delete trigger for a product. Uses useArchiveProduct mutation so
 * the button shows its own loading state, and the success toast fires
 * before navigation.
 */

import { Archive, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useArchiveProduct } from "@/lib/query/mutations";

type ArchiveButtonProps = {
  productId: string;
  productName: string;
};

export function ArchiveButton({ productId, productName }: ArchiveButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const archiveProduct = useArchiveProduct();

  const handleArchive = async () => {
    const result = await archiveProduct.mutateAsync(productId);
    if (result.ok) {
      toast.success(`"${productName}" archivado`);
      setOpen(false);
      router.push("/products");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" disabled={archiveProduct.isPending}>
            {archiveProduct.isPending ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <Archive aria-hidden className="size-4" />
            )}
            Archivar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archivar "{productName}"?</DialogTitle>
          <DialogDescription>
            El producto deja de aparecer en ventas y listados nuevos. El
            historial de ventas anteriores se conserva.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button type="button" variant="outline" disabled={archiveProduct.isPending} />}
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={archiveProduct.isPending}
            onClick={handleArchive}
          >
            {archiveProduct.isPending ? (
              <>
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Archivando…
              </>
            ) : (
              "Sí, archivar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
