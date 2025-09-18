"use client";

import { useState } from "react";
import { StockMovementsTable } from "./stock-movements-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
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

interface StockMovementsClientProps {
  movements: StockMovement[];
}

export function StockMovementsClient({ movements }: StockMovementsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Filtrar movimientos basado en los criterios de búsqueda
  const filteredMovements = movements.filter((movement) => {
    // Filtro de búsqueda por producto, SKU o motivo
    const matchesSearch =
      searchQuery === "" ||
      movement.inventoryItem.product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      movement.inventoryItem.product.sku
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      movement.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.inventoryItem.lotNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    // Filtro por tipo de movimiento
    const matchesType = typeFilter === "all" || movement.type === typeFilter;

    // Filtro por fecha
    let matchesDate = true;
    if (dateFilter !== "all") {
      const now = new Date();
      const movementDate = new Date(movement.createdAt);

      switch (dateFilter) {
        case "today":
          matchesDate = movementDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = movementDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = movementDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setDateFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" || typeFilter !== "all" || dateFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto, SKU, lote o motivo..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro por tipo */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de movimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="INBOUND">Entradas</SelectItem>
              <SelectItem value="OUTBOUND">Salidas</SelectItem>
              <SelectItem value="ADJUSTMENT">Ajustes</SelectItem>
              <SelectItem value="TRANSFER">Transferencias</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por fecha */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botón para limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Información de resultados */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters ? (
            <>
              Mostrando {filteredMovements.length} de {movements.length}{" "}
              transacciones
              {searchQuery && (
                <span> • Búsqueda: &quot;{searchQuery}&quot;</span>
              )}
            </>
          ) : (
            `${movements.length} transacciones totales`
          )}
        </div>
      </div>

      {/* Tabla */}
      <StockMovementsTable movements={filteredMovements} />
    </div>
  );
}
