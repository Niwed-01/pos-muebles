import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/shared/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "POS Muebles",
  description: "Sistema de Punto de Venta para Mueblería",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
