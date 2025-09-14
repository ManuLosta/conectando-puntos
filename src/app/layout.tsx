import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Roboto } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--display-family",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--text-family",
});

export const metadata: Metadata = {
  title: "Conectando Puntos",
  description: "Conectando Puntos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${poppins.variable} ${roboto.variable} antialiased`}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
