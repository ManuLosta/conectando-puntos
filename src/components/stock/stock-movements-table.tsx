"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ArrowLeftRight,
} from "lucide-react";
import { StockMovementType } from "@prisma/client";

interface StockMovement {
  id: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdAt: Date;
  inventoryItem: {
    id: string;
    lotNumber: string;
    expirationDate: Date;
    product: {
      id: string;
      name: string;
      sku: string;
      price: number;
    };
  };
  order: {
    id: string;
    orderNumber: string;
  } | null;
}

interface StockMovementsTableProps {
  movements: StockMovement[];
}

function getMovementTypeBadge(type: StockMovementType) {
  switch (type) {
    case "INBOUND":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          <ArrowUp className="h-3 w-3 mr-1" />
          Entrada
        </Badge>
      );
    case "OUTBOUND":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 hover:bg-red-100"
        >
          <ArrowDown className="h-3 w-3 mr-1" />
          Salida
        </Badge>
      );
    case "ADJUSTMENT":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 hover:bg-blue-100"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Ajuste
        </Badge>
      );
    case "TRANSFER":
      return (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-800 hover:bg-purple-100"
        >
          <ArrowLeftRight className="h-3 w-3 mr-1" />
          Transferencia
        </Badge>
      );
    default:
      return <Badge variant="secondary">Desconocido</Badge>;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(date: Date) {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function StockMovementsTable({ movements }: StockMovementsTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Producto</TableHead>
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold text-center">
              Cantidad
            </TableHead>
            <TableHead className="font-semibold text-center">
              Stock Anterior
            </TableHead>
            <TableHead className="font-semibold text-center">
              Stock Nuevo
            </TableHead>
            <TableHead className="font-semibold">Lote</TableHead>
            <TableHead className="font-semibold">Motivo</TableHead>
            <TableHead className="font-semibold">Fecha</TableHead>
            <TableHead className="font-semibold text-center">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id} className="hover:bg-muted/50">
              <TableCell>
                <div>
                  <div className="font-medium">
                    {movement.inventoryItem.product.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    SKU: {movement.inventoryItem.product.sku}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Precio:{" "}
                    {formatCurrency(movement.inventoryItem.product.price)}
                  </div>
                </div>
              </TableCell>
              <TableCell>{getMovementTypeBadge(movement.type)}</TableCell>
              <TableCell className="text-center">
                <span
                  className={`font-medium ${
                    movement.type === "INBOUND"
                      ? "text-green-600"
                      : movement.type === "OUTBOUND"
                        ? "text-red-600"
                        : "text-blue-600"
                  }`}
                >
                  {movement.type === "INBOUND"
                    ? "+"
                    : movement.type === "OUTBOUND"
                      ? "-"
                      : ""}
                  {movement.quantity}
                </span>
              </TableCell>
              <TableCell className="text-center font-medium">
                {movement.previousStock}
              </TableCell>
              <TableCell className="text-center font-medium">
                {movement.newStock}
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-sm font-medium">
                    {movement.inventoryItem.lotNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Vence:{" "}
                    {formatDateShort(movement.inventoryItem.expirationDate)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  <div className="text-sm">
                    {movement.reason || "Sin motivo especificado"}
                  </div>
                  {movement.order && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Pedido: {movement.order.orderNumber}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{formatDate(movement.createdAt)}</div>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    // TODO: Implementar modal de detalles del movimiento
                    console.log("Ver detalles del movimiento:", movement.id);
                  }}
                  title="Ver detalles"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {movements.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No se encontraron transacciones de stock
          </p>
        </div>
      )}
    </div>
  );
}
