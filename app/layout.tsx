import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Roleta Mimo e Cor",
  description: "Gire a roleta e concorra a prêmios incríveis da Mimo e Cor!",
  generator: "v0.app",
  openGraph: {
    title: "Roleta Mimo e Cor",
    description: "Gire a roleta e concorra a prêmios incríveis! Vale compra de R$ 50 em produtos Mimo e Cor",
    type: "website",
    locale: "pt_BR",
    siteName: "Roleta Mimo e Cor",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Roleta Mimo e Cor - Concorra a prêmios incríveis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roleta Mimo e Cor",
    description: "Gire a roleta e concorra a prêmios incríveis!",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/images/mimo-20e-20cor-20logotipo-20006.png",
    apple: "/images/mimo-20e-20cor-20logotipo-20006.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
