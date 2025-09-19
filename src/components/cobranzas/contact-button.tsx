"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DollarSign, Phone, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContactButtonProps {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  invoiceNumber: string;
  pendingAmount: number;
}

export function ContactButton({
  clientName,
  clientPhone,
  clientEmail,
  invoiceNumber,
  pendingAmount,
}: ContactButtonProps) {
  const { toast } = useToast();

  const handleCall = () => {
    if (clientPhone) {
      window.open(`tel:${clientPhone}`, "_self");
      toast({
        title: "Llamando al cliente",
        description: `Iniciando llamada a ${clientName} (${clientPhone})`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Sin teléfono",
        description: "Este cliente no tiene un número de teléfono registrado",
      });
    }
  };

  const handleEmail = () => {
    if (clientEmail) {
      const subject = encodeURIComponent(
        `Recordatorio de pago - Factura ${invoiceNumber}`,
      );
      const body = encodeURIComponent(
        `Estimado/a ${clientName},\n\n` +
          `Le recordamos que tiene pendiente el pago de la factura ${invoiceNumber} ` +
          `por un monto de $${pendingAmount.toLocaleString()}.\n\n` +
          `Para cualquier consulta, no dude en contactarnos.\n\n` +
          `Saludos cordiales`,
      );
      window.open(
        `mailto:${clientEmail}?subject=${subject}&body=${body}`,
        "_self",
      );
      toast({
        title: "Abriendo email",
        description: `Preparando email para ${clientName}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Sin email",
        description: "Este cliente no tiene un email registrado",
      });
    }
  };

  const handleWhatsApp = () => {
    if (clientPhone) {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = clientPhone.replace(/\D/g, "");
      const message = encodeURIComponent(
        `Hola ${clientName}, le recordamos que tiene pendiente el pago de la factura ${invoiceNumber} por $${pendingAmount.toLocaleString()}. ¡Gracias!`,
      );
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
      toast({
        title: "Abriendo WhatsApp",
        description: `Enviando mensaje a ${clientName}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Sin teléfono",
        description: "Este cliente no tiene un número de teléfono registrado",
      });
    }
  };

  const hasContactInfo = clientPhone || clientEmail;

  if (!hasContactInfo) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          toast({
            variant: "destructive",
            title: "Sin información de contacto",
            description: "Este cliente no tiene teléfono ni email registrado",
          })
        }
      >
        <DollarSign className="h-4 w-4 mr-1" />
        Contactar
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="h-4 w-4 mr-1" />
          Contactar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {clientPhone && (
          <>
            <DropdownMenuItem onClick={handleCall} className="cursor-pointer">
              <Phone className="h-4 w-4 mr-2" />
              Llamar
              <span className="ml-auto text-xs text-muted-foreground">
                {clientPhone}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleWhatsApp}
              className="cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </DropdownMenuItem>
          </>
        )}
        {clientEmail && (
          <DropdownMenuItem onClick={handleEmail} className="cursor-pointer">
            <Mail className="h-4 w-4 mr-2" />
            Email
            <span className="ml-auto text-xs text-muted-foreground">
              {clientEmail.length > 15
                ? clientEmail.substring(0, 15) + "..."
                : clientEmail}
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
