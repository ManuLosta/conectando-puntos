"use client";

import * as React from "react";
import {
  HomeIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  UsersIcon,
  UserCheckIcon,
  PackageIcon,
  BotIcon,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavHeader } from "@/components/sidebar/nav-header";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

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
      title: "Dashboard",
      url: "/",
      icon: HomeIcon,
    },
    {
      title: "Pedidos",
      url: "/pedidos",
      icon: ShoppingCartIcon,
    },
    {
      title: "Cobranzas",
      url: "#",
      icon: DollarSignIcon,
    },
  ],
  navAdmin: [
    {
      title: "Clientes",
      url: "/clientes",
      icon: UsersIcon,
    },
    {
      title: "Vendedores",
      url: "/vendedores",
      icon: UserCheckIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} variant="inset">
      <SidebarHeader>
        <NavHeader company={data.company} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarMenu>
            {data.navAdmin.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Labs</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Agente de Ventas">
                <Link href="/agent-playground">
                  <BotIcon />
                  <span>Agente de Ventas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
