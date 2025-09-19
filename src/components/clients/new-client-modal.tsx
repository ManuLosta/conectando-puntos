"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { X } from "lucide-react";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: ClientFormData) => Promise<void>;
}

interface ClientFormData {
  name: string;
  clientType: string;
  phone: string;
  email: string;
  address: string;
  assignedSalespersonId?: string;
  notes: string;
}

interface Salesperson {
  id: string;
  name: string;
  phone?: string;
}

const CLIENT_TYPES = [
  "Supermercado",
  "Mercado Chino",
  "Almacén",
  "Minimarket",
  "Kiosco",
  "Restaurante",
  "Cafetería",
  "Otro",
];

export function NewClientModal({
  isOpen,
  onClose,
  onSave,
}: NewClientModalProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    clientType: "",
    phone: "",
    email: "",
    address: "",
    assignedSalespersonId: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [loadingSalespeople, setLoadingSalespeople] = useState(false);

  // Fetch salespeople when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSalespeople();
    }
  }, [isOpen]);

  const fetchSalespeople = async () => {
    setLoadingSalespeople(true);
    try {
      const response = await fetch("/api/salespeople");
      if (response.ok) {
        const data = await response.json();
        setSalespeople(data);
      } else {
        console.error("Failed to fetch salespeople");
      }
    } catch (error) {
      console.error("Error fetching salespeople:", error);
    } finally {
      setLoadingSalespeople(false);
    }
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Convert "unassigned" to undefined, otherwise use the selected salesperson ID
      const submitData = {
        ...formData,
        assignedSalespersonId:
          formData.assignedSalespersonId === "unassigned" ||
          formData.assignedSalespersonId === ""
            ? undefined
            : formData.assignedSalespersonId,
      };

      await onSave(submitData);
      // Reset form
      setFormData({
        name: "",
        clientType: "",
        phone: "",
        email: "",
        address: "",
        assignedSalespersonId: "",
        notes: "",
      });
      onClose();
    } catch (error) {
      console.error("Error creating client:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Agregar Nuevo Cliente
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Completa los datos del nuevo cliente
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre/Razón Social */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre/Razón Social</Label>
              <Input
                id="name"
                placeholder="Nombre del cliente"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Tipo de Cliente */}
            <div className="space-y-2">
              <Label htmlFor="clientType">Tipo de Cliente</Label>
              <Select
                value={formData.clientType}
                onValueChange={(value) =>
                  handleInputChange("clientType", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+54 11 1234-5678"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Dirección completa"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Vendedor Asignado */}
          <div className="space-y-2">
            <Label htmlFor="assignedSalesperson">Vendedor Asignado</Label>
            <Select
              value={formData.assignedSalespersonId}
              onValueChange={(value) =>
                handleInputChange("assignedSalespersonId", value)
              }
              disabled={isLoading || loadingSalespeople}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingSalespeople
                      ? "Cargando vendedores..."
                      : "Seleccionar vendedor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {salespeople.map((salesperson) => (
                  <SelectItem key={salesperson.id} value={salesperson.id}>
                    {salesperson.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre el cliente..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? "Creando..." : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
