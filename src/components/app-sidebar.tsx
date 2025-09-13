"use client";

import * as React from "react";
import {
  HomeIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  UsersIcon,
  PackageIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavHeader } from "@/components/nav-header";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Navigation data for Conectando Puntos
const data = {
  company: {
    name: "Conectando Puntos",
    logo: PackageIcon,
    plan: "Sistema de Gestión",
  },
  user: {
    name: "Usuario",
    email: "usuario@conectandopuntos.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Torre de Control",
      url: "#",
      icon: HomeIcon,
      isActive: true,
    },
    {
      title: "Pedidos y Facturación",
      url: "#",
      icon: ShoppingCartIcon,
    },
    {
      title: "Cobranzas",
      url: "#",
      icon: DollarSignIcon,
    },
    {
      title: "Clientes",
      url: "#",
      icon: UsersIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavHeader company={data.company} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
