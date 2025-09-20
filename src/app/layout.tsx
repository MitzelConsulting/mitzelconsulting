// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ChatbotProvider } from "@/context/ChatbotContext";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mitzel Consulting - Safety Training Platform",
  description: "Professional OSHA safety training courses for your team. Digital and on-site training options available.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`}>
        <CartProvider>
          <ChatbotProvider>
            <Navbar />
            <main>{children}</main>
            <Chatbot />
          </ChatbotProvider>
        </CartProvider>
      </body>
    </html>
  )
}