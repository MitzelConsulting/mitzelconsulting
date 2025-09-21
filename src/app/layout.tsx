// src/app/layout.tsx

import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { ChatbotProvider } from "@/context/ChatbotContext";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";

const lato = Lato({ 
  subsets: ["latin"],
  weight: ['300', '400', '700', '900']
});

export const metadata: Metadata = {
  title: "Mitzel Safety Consulting - Safety Training Platform",
  description: "Professional OSHA safety training courses for your team. Digital and on-site training options available.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${lato.className} bg-gray-50 text-gray-900`}>
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