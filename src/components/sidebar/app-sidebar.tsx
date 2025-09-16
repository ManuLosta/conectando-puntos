"use client";

import * as React from "react";
import {
  HomeIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  UsersIcon,
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
    <Sidebar collapsible="icon" {...props} variant="inset">
      <SidebarHeader>
        <NavHeader company={data.company} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Labs</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Agent Playground">
                <a href="/agent-playground">
                  <BotIcon />
                  <span>Agent Playground</span>
                </a>
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
