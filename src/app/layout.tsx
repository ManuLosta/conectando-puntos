import type { Metadata } from "next";
import { Poppins, Roboto } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
