"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  DollarSign,
  Search,
  Loader2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { InvoiceCollection } from "@/services/cobranzas.service";

interface RegisterPaymentModalProps {
  onPaymentRegistered?: () => void;
}

interface SearchableInvoiceSelectProps {
  invoices: InvoiceCollection[];
  selectedInvoiceId: string;
  onSelect: (invoice: InvoiceCollection) => void;
  placeholder: string;
}

function SearchableInvoiceSelect({
  invoices,
  selectedInvoiceId,
  onSelect,
  placeholder,
}: SearchableInvoiceSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.cliente.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearchTerm("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full justify-between h-auto min-h-[40px] p-3",
          selectedInvoice ? "text-left" : "text-muted-foreground",
        )}
        onClick={() => setOpen(!open)}
      >
        {selectedInvoice ? (
          <div className="flex items-center justify-between w-full min-w-0">
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="font-medium text-foreground truncate max-w-full">
                {selectedInvoice.invoiceNumber}
              </span>
              <span className="text-sm text-muted-foreground truncate max-w-full">
                {selectedInvoice.cliente}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <Badge
                variant={
                  selectedInvoice.estado === "Vencida"
                    ? "destructive"
                    : selectedInvoice.estado === "Por Vencer"
                      ? "default"
                      : "secondary"
                }
                className="text-xs whitespace-nowrap"
              >
                {selectedInvoice.estado}
              </Badge>
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {formatCurrency(selectedInvoice.montoPendiente)}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por factura o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[250px] overflow-auto">
            {filteredInvoices.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {invoices.length === 0 ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando facturas...
                  </div>
                ) : (
                  "No se encontraron facturas"
                )}
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={cn(
                    "flex items-center justify-between p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                    selectedInvoiceId === invoice.id &&
                      "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    onSelect(invoice);
                    setOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                    <span className="text-sm text-muted-foreground">
                      {invoice.cliente}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge
                      variant={
                        invoice.estado === "Vencida"
                          ? "destructive"
                          : invoice.estado === "Por Vencer"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {invoice.estado}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(invoice.montoPendiente)}
                    </span>
                    {selectedInvoiceId === invoice.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RegisterPaymentModal({
  onPaymentRegistered,
}: RegisterPaymentModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceCollection[]>([]);
  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceCollection | null>(null);
  const [formData, setFormData] = useState({
    invoiceId: "",
    amount: "",
    paymentMethod: "",
    reference: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Fetch available invoices when modal opens and reset form when closed
  useEffect(() => {
    if (open) {
      fetchInvoices();
    } else {
      // Reset form when modal is closed
      setFormData({
        invoiceId: "",
        amount: "",
        paymentMethod: "",
        reference: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      setSelectedInvoice(null);
    }
  }, [open]);

  // Keep selectedInvoice in sync with formData.invoiceId
  useEffect(() => {
    if (formData.invoiceId && invoices.length > 0) {
      const invoice = invoices.find((inv) => inv.id === formData.invoiceId);
      if (invoice && selectedInvoice?.id !== invoice.id) {
        console.log("Syncing selected invoice:", invoice.invoiceNumber);
        setSelectedInvoice(invoice);
      }
    } else if (!formData.invoiceId && selectedInvoice) {
      console.log("Clearing selected invoice");
      setSelectedInvoice(null);
    }
  }, [formData.invoiceId, invoices, selectedInvoice]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices/collection");
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }
      const { invoices } = await response.json();
      setInvoices(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      // For development, if the API isn't ready, we can show an empty state
      setInvoices([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.invoiceId ||
      !formData.amount ||
      !formData.paymentMethod ||
      !formData.date
    ) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor completa todos los campos requeridos",
      });
      return;
    }

    setLoading(true);

    try {
      // Call the API to register the payment
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al registrar el pago");
      }

      await response.json();
      toast({
        variant: "success",
        title: "¡Pago registrado!",
        description: "El pago se ha registrado exitosamente",
      });

      // Close modal first
      setOpen(false);

      // Reset form
      setFormData({
        invoiceId: "",
        amount: "",
        paymentMethod: "",
        reference: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      setSelectedInvoice(null);

      // Refresh invoices list
      await fetchInvoices();

      if (onPaymentRegistered) {
        onPaymentRegistered();
      }

      // Refresh the page to update all data (with small delay to ensure DB is updated)
      console.log("Refreshing page after payment...");
      setTimeout(() => {
        router.refresh();
      }, 500);

      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al registrar el pago",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado",
      });
      console.error("Error registering payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // If changing the amount, don't clear the selected invoice
    // The selected invoice should only be cleared when explicitly selecting a new one
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
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice">Factura *</Label>
              <div className="space-y-2">
                <SearchableInvoiceSelect
                  invoices={invoices}
                  selectedInvoiceId={formData.invoiceId}
                  onSelect={(invoice) => {
                    console.log("Invoice selected:", invoice.invoiceNumber);
                    handleInputChange("invoiceId", invoice.id);
                    setSelectedInvoice(invoice);
                    // Set the amount to the pending amount by default, but user can change it
                    handleInputChange(
                      "amount",
                      invoice.montoPendiente.toString(),
                    );
                  }}
                  placeholder="Seleccionar factura"
                />
                {selectedInvoice && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                      <span>Monto total:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedInvoice.monto)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monto pendiente:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(selectedInvoice.montoPendiente)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Vencimiento:</span>
                      <span className="font-medium">
                        {selectedInvoice.vencimiento}
                      </span>
                    </div>
                  </div>
                )}
              </div>
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
                onChange={(e) => {
                  // Only update the amount, don't affect selected invoice
                  handleInputChange("amount", e.target.value);
                }}
                onKeyDown={(e) => {
                  // Prevent Enter from submitting the form
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha de Pago *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
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
