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
  Package2Icon,
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
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: HomeIcon,
    },
    {
      title: "Pedidos",
      url: "/dashboard/pedidos",
      icon: ShoppingCartIcon,
    },
    {
      title: "Stock",
      url: "/dashboard/stock",
      icon: Package2Icon,
    },
    {
      title: "Cobranzas",
      url: "/dashboard/cobranzas",
      icon: DollarSignIcon,
    },
  ],
  navAdmin: [
    {
      title: "Clientes",
      url: "/dashboard/clientes",
      icon: UsersIcon,
    },
    {
      title: "Vendedores",
      url: "/dashboard/vendedores",
      icon: UserCheckIcon,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
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
                <Link href="/dashboard/agent-playground">
                  <BotIcon />
                  <span>Agente de Ventas</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser
            user={{
              name: user.name,
              email: user.email,
              avatar: user.image || "/avatars/user.jpg",
            }}
          />
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
