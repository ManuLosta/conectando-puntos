"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, DollarSign } from "lucide-react";

interface RegisterPaymentModalProps {
  onPaymentRegistered?: () => void;
}

export function RegisterPaymentModal({
  onPaymentRegistered,
}: RegisterPaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    amount: "",
    paymentMethod: "",
    reference: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here you would call your payment service to register the payment
      // await paymentService.registerPayment(formData);

      // For now, just simulate the API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("Pago registrado exitosamente");
      setOpen(false);
      setFormData({
        invoiceNumber: "",
        amount: "",
        paymentMethod: "",
        reference: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });

      if (onPaymentRegistered) {
        onPaymentRegistered();
      }
    } catch (error) {
      alert("Error al registrar el pago");
      console.error("Error registering payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Cobro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Registrar Cobro
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de Factura *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  handleInputChange("invoiceNumber", e.target.value)
                }
                placeholder="F-001234"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Pago *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pago *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  handleInputChange("paymentMethod", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referencia/Número de Operación</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => handleInputChange("reference", e.target.value)}
              placeholder="Número de transferencia, cheque, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Información adicional sobre el pago"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
