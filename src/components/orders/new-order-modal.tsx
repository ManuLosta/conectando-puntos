import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  Search,
  User,
  Package,
  MapPin,
  FileText,
  ShoppingCart,
  X,
  Calculator,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
}

interface OrderItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface CreateOrderData {
  clientId: string;
  salespersonId: string;
  items: Array<{
    sku: string;
    quantity: number;
  }>;
  deliveryAddress?: string;
  notes?: string;
}

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: CreateOrderData) => void;
}

// Mock data para productos
const mockProducts: Product[] = [
  {
    id: "1",
    sku: "LSE-001",
    name: "Leche Entera La Serenísima",
    brand: "La Serenísima",
    price: 450,
    stock: 120,
  },
  {
    id: "2",
    sku: "BIM-002",
    name: "Pan Lactal Bimbo",
    brand: "Bimbo",
    price: 380,
    stock: 85,
  },
  {
    id: "3",
    sku: "SAN-003",
    name: "Queso Cremoso Sancor",
    brand: "Sancor",
    price: 890,
    stock: 45,
  },
  {
    id: "4",
    sku: "PAL-004",
    name: "Jamón Cocido Paladini",
    brand: "Paladini",
    price: 1200,
    stock: 30,
  },
  {
    id: "5",
    sku: "NAT-005",
    name: "Aceite Girasol Natura",
    brand: "Natura",
    price: 520,
    stock: 60,
  },
];

// Mock data para clientes
const mockClients = [
  {
    id: "1",
    name: "Supermercado La Abundancia",
    address: "Av. Corrientes 1234, CABA",
  },
  {
    id: "2",
    name: "Almacén Don Pepe",
    address: "San Martín 567, Vicente López",
  },
  { id: "3", name: "Mercado Central", address: "Rivadavia 890, La Matanza" },
  {
    id: "4",
    name: "Minimarket El Barrio",
    address: "Belgrano 345, San Isidro",
  },
];

// Mock data para vendedores
const mockSalespeople = [
  { id: "1", name: "Juan Pérez" },
  { id: "2", name: "Ana Gómez" },
  { id: "3", name: "Carlos López" },
  { id: "4", name: "María Silva" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function NewOrderModal({ isOpen, onClose, onSave }: NewOrderModalProps) {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Filtrar productos por búsqueda
  const filteredProducts = mockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.brand.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const addProductToOrder = () => {
    if (!selectedProduct || quantity <= 0) return;

    if (quantity > selectedProduct.stock) {
      toast({
        variant: "destructive",
        title: "Stock insuficiente",
        description: `Stock disponible: ${selectedProduct.stock}`,
      });
      return;
    }

    const existingItemIndex = orderItems.findIndex(
      (item) => item.product.id === selectedProduct.id,
    );

    if (existingItemIndex >= 0) {
      // Actualizar cantidad del producto existente
      const updatedItems = [...orderItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;

      if (newQuantity > selectedProduct.stock) {
        toast({
          variant: "destructive",
          title: "Stock insuficiente",
          description: `Stock disponible: ${selectedProduct.stock}`,
        });
        return;
      }

      updatedItems[existingItemIndex].quantity = newQuantity;
      updatedItems[existingItemIndex].subtotal =
        newQuantity * selectedProduct.price;
      setOrderItems(updatedItems);
    } else {
      // Agregar nuevo producto
      const newItem: OrderItem = {
        product: selectedProduct,
        quantity,
        subtotal: quantity * selectedProduct.price,
      };
      setOrderItems([...orderItems, newItem]);
    }

    // Resetear selección
    setSelectedProduct(null);
    setQuantity(1);
    setProductSearch("");
  };

  const removeProductFromOrder = (productId: string) => {
    setOrderItems(orderItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProductFromOrder(productId);
      return;
    }

    const product = mockProducts.find((p) => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stock) {
      toast({
        variant: "destructive",
        title: "Stock insuficiente",
        description: `Stock disponible: ${product.stock}`,
      });
      return;
    }

    const updatedItems = orderItems.map((item) => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.product.price,
        };
      }
      return item;
    });
    setOrderItems(updatedItems);
  };

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderData: CreateOrderData = {
      clientId: selectedClient,
      salespersonId: selectedSalesperson,
      items: orderItems.map((item) => ({
        sku: item.product.sku,
        quantity: item.quantity,
      })),
      deliveryAddress: deliveryAddress || undefined,
      notes: notes || undefined,
    };

    onSave(orderData);
    handleClose();
  };

  const handleClose = () => {
    // Resetear formulario
    setSelectedClient("");
    setSelectedSalesperson("");
    setDeliveryAddress("");
    setNotes("");
    setOrderItems([]);
    setProductSearch("");
    setSelectedProduct(null);
    setQuantity(1);
    onClose();
  };

  const selectedClientData = mockClients.find((c) => c.id === selectedClient);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Nuevo Pedido
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda - Información del Pedido */}
          <div className="space-y-6">
            {/* Información del Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client">Cliente *</Label>
                  <Select
                    value={selectedClient}
                    onValueChange={setSelectedClient}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="salesperson">Vendedor *</Label>
                  <Select
                    value={selectedSalesperson}
                    onValueChange={setSelectedSalesperson}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSalespeople.map((salesperson) => (
                        <SelectItem key={salesperson.id} value={salesperson.id}>
                          {salesperson.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClientData && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Dirección registrada:
                    </p>
                    <p className="font-medium">{selectedClientData.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dirección de Entrega */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Dirección de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="delivery-address">Dirección (opcional)</Label>
                  <Textarea
                    id="delivery-address"
                    placeholder="Dirección específica de entrega (si es diferente a la registrada)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="notes">Observaciones (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Instrucciones especiales, horarios de entrega, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha - Productos */}
          <div className="space-y-6">
            {/* Agregar Productos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Agregar Productos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Búsqueda de productos */}
                <div>
                  <Label>Buscar producto</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, SKU o marca..."
                      className="pl-10"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Lista de productos filtrados */}
                {productSearch && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${selectedProduct?.id === product.id ? "bg-blue-50" : ""}`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">
                              {product.brand} - {product.sku}
                            </p>
                            <p className="text-sm text-green-600">
                              Stock: {product.stock}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Producto seleccionado y cantidad */}
                {selectedProduct && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-600">
                          {selectedProduct.brand} - {selectedProduct.sku}
                        </p>
                        <p className="text-sm text-green-600">
                          Stock disponible: {selectedProduct.stock}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(selectedProduct.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label>Cantidad:</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={selectedProduct.stock}
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          className="w-20 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setQuantity(
                              Math.min(selectedProduct.stock, quantity + 1),
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={addProductToOrder} className="ml-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de productos agregados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Productos en el Pedido
                    <Badge variant="secondary">{orderItems.length}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total:</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(getTotalAmount())}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.length > 0 ? (
                  <div className="space-y-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-center">
                            Cantidad
                          </TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {item.product.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {item.product.sku}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    updateQuantity(
                                      item.product.id,
                                      item.quantity - 1,
                                    )
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="mx-2 font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    updateQuantity(
                                      item.product.id,
                                      item.quantity + 1,
                                    )
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.product.price)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-600 hover:text-red-700"
                                onClick={() =>
                                  removeProductFromOrder(item.product.id)
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay productos agregados al pedido</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedClient || !selectedSalesperson || orderItems.length === 0
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Crear Pedido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
