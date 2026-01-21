import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { ChatSidebar } from "@/components/chat-sidebar"

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

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
      <body className={`${poppins.className} bg-black text-white antialiased`}>
        {children}
        <ChatSidebar />
      </body>
    </html>
  )
}
