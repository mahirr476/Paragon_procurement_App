import type React from "react"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ChatSidebar } from "@/components/chat-sidebar"

const geistMono = GeistMono

export const metadata: Metadata = {
  title: "Tactical Operations Dashboard",
  description: "Tactical command and control system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${geistMono.className} bg-black text-white antialiased`}>
        {children}
        <ChatSidebar />
      </body>
    </html>
  )
}
