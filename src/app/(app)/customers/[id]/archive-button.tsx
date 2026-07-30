"use client";

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
import { useArchiveCustomer } from "@/lib/query/mutations";

type ArchiveButtonProps = {
  customerId: string;
  customerName: string;
};

export function ArchiveCustomerButton({
  customerId,
  customerName,
}: ArchiveButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const archiveCustomer = useArchiveCustomer();

  const handleArchive = async () => {
    const result = await archiveCustomer.mutateAsync(customerId);
    if (result.ok) {
      toast.success(`"${customerName}" archivado`);
      setOpen(false);
      router.push("/customers");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" disabled={archiveCustomer.isPending}>
            {archiveCustomer.isPending ? (
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
          <DialogTitle>Archivar &quot;{customerName}&quot;?</DialogTitle>
          <DialogDescription>
            El cliente deja de aparecer en listados y en el selector del POS. El
            historial de compras se conserva.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline"
                disabled={archiveCustomer.isPending}
              />
            }
          >
            Cancelar
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={archiveCustomer.isPending}
            onClick={handleArchive}
          >
            {archiveCustomer.isPending ? (
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
