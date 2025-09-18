"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewClientModal } from "./new-client-modal";

interface ClientFormData {
  name: string;
  clientType: string;
  phone: string;
  email: string;
  address: string;
  assignedSalespersonId?: string;
  notes: string;
}

interface ClientsPageClientProps {
  children: React.ReactNode;
}

export function ClientsPageClient({ children }: ClientsPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateClient = async (clientData: ClientFormData) => {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        throw new Error(
          `Failed to create client: ${errorData.error || response.statusText}`,
        );
      }

      // Refresh the page to show the new client
      window.location.reload();
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de Clientes</h1>
          <p className="text-muted-foreground">
            Administra tu cartera de clientes y sus datos
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {children}

      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateClient}
      />
    </>
  );
}
