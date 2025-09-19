"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Edit,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Eye,
  X,
  Calendar,
} from "lucide-react";

interface StockMovement {
  id: string;
  type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  lotNumber: string;
  order?: {
    id: string;
    orderNumber: string;
  } | null;
}

interface StockMovementsResponse {
  movements: StockMovement[];
  total: number;
  hasMore: boolean;
  pagination: {
    limit: number;
    offset: number;
    currentPage: number;
    totalPages: number;
  };
}

interface StockMovementsClientProps {
  distributorId: string;
}

// Agregar interface para el modal de detalle
interface MovementDetailModalProps {
  movement: StockMovement | null;
  isOpen: boolean;
  onClose: () => void;
}

// Hook useDebounce inline
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const movementTypeConfig = {
  INBOUND: {
    label: "Entrada",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-100 text-green-800",
  },
  OUTBOUND: {
    label: "Salida",
    icon: TrendingDown,
    color: "text-red-600",
    bgColor: "bg-red-100 text-red-800",
  },
  ADJUSTMENT: {
    label: "Ajuste",
    icon: Edit,
    color: "text-blue-600",
    bgColor: "bg-blue-100 text-blue-800",
  },
  TRANSFER: {
    label: "Transferencia",
    icon: RefreshCw,
    color: "text-purple-600",
    bgColor: "bg-purple-100 text-purple-800",
  },
};

// Componente del modal de detalle
function MovementDetailModal({
  movement,
  isOpen,
  onClose,
}: MovementDetailModalProps) {
  if (!movement) return null;

  const config = movementTypeConfig[movement.type];
  const Icon = config.icon;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStockChangeDisplay = (movement: StockMovement) => {
    const difference = movement.newStock - movement.previousStock;

    if (difference > 0) {
      return (
        <span className="text-green-600 font-bold text-xl">+{difference}</span>
      );
    } else if (difference < 0) {
      return (
        <span className="text-red-600 font-bold text-xl">{difference}</span>
      );
    } else {
      return <span className="text-gray-600 font-bold text-xl">0</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <Icon className={`h-6 w-6 ${config.color}`} />
              Detalle del Movimiento
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Movimiento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon className={`h-5 w-5 ${config.color}`} />
                Información del Movimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge className={`${config.bgColor} text-base px-3 py-1`}>
                    {config.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cantidad</p>
                  <p className="text-xl font-bold">{movement.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Stock Anterior
                  </p>
                  <p className="text-lg font-semibold text-muted-foreground">
                    {movement.previousStock}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Nuevo</p>
                  <p className="text-lg font-semibold">{movement.newStock}</p>
                </div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Cambio Neto
                </p>
                {getStockChangeDisplay(movement)}
              </div>
            </CardContent>
          </Card>

          {/* Información del Producto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium text-lg">{movement.product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono font-medium">
                    {movement.product.sku}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lote</p>
                  <p className="font-mono font-medium">{movement.lotNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles Adicionales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalles Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                <p className="font-medium">
                  {formatDateTime(movement.createdAt)}
                </p>
              </div>
              {movement.order && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pedido Relacionado
                  </p>
                  <p className="font-mono font-medium">
                    {movement.order.orderNumber}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Motivo</p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {movement.reason || "No se especificó un motivo"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StockMovementsClient({
  distributorId,
}: StockMovementsClientProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Estado para el modal de detalle
  const [selectedMovement, setSelectedMovement] =
    useState<StockMovement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const itemsPerPage = 25;

  // Filtrar movimientos por búsqueda localmente
  const filteredMovements = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return movements;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return movements.filter(
      (movement) =>
        movement.product.name.toLowerCase().includes(query) ||
        movement.product.sku.toLowerCase().includes(query) ||
        movement.lotNumber.toLowerCase().includes(query) ||
        (movement.reason && movement.reason.toLowerCase().includes(query)) ||
        (movement.order?.orderNumber &&
          movement.order.orderNumber.toLowerCase().includes(query)),
    );
  }, [movements, debouncedSearchQuery]);

  // Cargar movimientos
  const fetchMovements = async (page: number) => {
    try {
      setLoading(true);
      const offset = (page - 1) * itemsPerPage;

      const response = await fetch(
        `/api/stock/movements?limit=${itemsPerPage}&offset=${offset}`,
      );

      if (!response.ok) {
        throw new Error("Error al cargar movimientos");
      }

      const data: StockMovementsResponse = await response.json();

      setMovements(data.movements);
      setTotal(data.total);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(data.pagination.currentPage);
    } catch (error) {
      console.error("Error fetching movements:", error);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto inicial para cargar datos
  useEffect(() => {
    fetchMovements(1);
  }, [distributorId]);

  // Simular loading durante búsqueda
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, debouncedSearchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchMovements(newPage);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMovementIcon = (type: keyof typeof movementTypeConfig) => {
    const config = movementTypeConfig[type];
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const getStockChangeDisplay = (movement: StockMovement) => {
    const difference = movement.newStock - movement.previousStock;

    if (difference > 0) {
      return <span className="text-green-600 font-medium">+{difference}</span>;
    } else if (difference < 0) {
      return <span className="text-red-600 font-medium">{difference}</span>;
    } else {
      return <span className="text-gray-600">0</span>;
    }
  };

  const handleViewMovement = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMovement(null);
  };

  if (loading && movements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar movimientos..."
                className="pl-10"
                disabled
              />
            </div>
          </div>
        </div>

        <div className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Stock Anterior</TableHead>
                <TableHead>Stock Nuevo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con búsqueda */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
            <Input
              placeholder="Buscar movimientos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
          </div>
          <div className="flex items-center gap-2">
            {isSearching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {filteredMovements.length} movimiento
                {filteredMovements.length !== 1 ? "s" : ""}
                {searchQuery.trim() && (
                  <span className="ml-1">para &ldquo;{searchQuery}&rdquo;</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Producto</TableHead>
              <TableHead className="font-semibold">SKU</TableHead>
              <TableHead className="font-semibold">Lote</TableHead>
              <TableHead className="font-semibold text-center">
                Cantidad
              </TableHead>
              <TableHead className="font-semibold text-center">
                Stock Ant.
              </TableHead>
              <TableHead className="font-semibold text-center">
                Stock Nuevo
              </TableHead>
              <TableHead className="font-semibold text-center">
                Cambio
              </TableHead>
              <TableHead className="font-semibold">Fecha</TableHead>
              <TableHead className="font-semibold text-center w-16">
                Ver
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Package className="h-12 w-12 text-muted-foreground/50" />
                    <div>
                      <p className="text-lg font-medium text-muted-foreground">
                        {searchQuery.trim()
                          ? "No se encontraron movimientos"
                          : "No hay movimientos registrados"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery.trim()
                          ? "Intenta con otros términos de búsqueda"
                          : "Los movimientos de stock aparecerán aquí cuando se realicen cambios"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => {
                const config = movementTypeConfig[movement.type];
                return (
                  <TableRow key={movement.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.type)}
                        <Badge className={config.bgColor}>{config.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{movement.product.name}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {movement.product.sku}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {movement.lotNumber}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{movement.quantity}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">
                        {movement.previousStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{movement.newStock}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStockChangeDisplay(movement)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(movement.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center w-16">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewMovement(movement)}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {!searchQuery.trim() && totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, total)} de {total} movimientos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      <MovementDetailModal
        movement={selectedMovement}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </div>
  );
}
