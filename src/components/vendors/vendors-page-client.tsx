"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewSalespersonModal } from "./new-salesperson-modal";

interface SalespersonFormData {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

interface VendorsPageClientProps {
  children: React.ReactNode;
}

export function VendorsPageClient({ children }: VendorsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateSalesperson = async (
    salespersonData: SalespersonFormData,
  ) => {
    try {
      const response = await fetch("/api/salespeople", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(salespersonData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        throw new Error(
          `Failed to create salesperson: ${errorData.error || response.statusText}`,
        );
      }

      // Refresh the page to show the new salesperson
      window.location.reload();
    } catch (error) {
      console.error("Error creating salesperson:", error);
      throw error;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de Vendedores</h1>
          <p className="text-muted-foreground">
            Administra tu equipo de ventas y su rendimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Vendedor
          </Button>
        </div>
      </div>

      {children}

      <NewSalespersonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateSalesperson}
      />
    </>
  );
}
