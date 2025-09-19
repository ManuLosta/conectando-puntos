"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteProductModalProps {
  productId: string;
  productName: string;
  distributorId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export function DeleteProductModal({
  productId,
  productName,
  distributorId,
  isOpen,
  onOpenChange,
  onDelete,
}: DeleteProductModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Usar la API route en lugar del servicio directo
      const response = await fetch(
        `/api/stock/product?productId=${productId}&distributorId=${distributorId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar el producto");
      }

      toast.success("Producto eliminado exitosamente", {
        description:
          "El producto ha sido marcado como inactivo y su stock ajustado a 0",
      });

      onDelete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting product:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar el producto";

      toast.error("Error al eliminar producto", {
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <div className="text-lg font-semibold">Eliminar Producto</div>
              <div className="text-sm text-muted-foreground font-normal">
                Esta acción no se puede deshacer
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="pt-4">
            ¿Estás seguro de que quieres eliminar el producto{" "}
            <span className="font-semibold text-foreground">
              &ldquo;{productName}&rdquo;
            </span>
            ?
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium text-foreground mb-2">
                Esta acción realizará lo siguiente:
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Marcará el producto como inactivo (soft delete)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Ajustará todo el stock restante a 0 unidades</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>Registrará movimientos de stock para auditoría</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>No se podrá deshacer esta operación</span>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Producto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
