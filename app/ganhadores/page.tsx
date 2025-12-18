import { WinnersGallery } from "@/components/winners-gallery"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "Galeria de Ganhadores - Mimo e Cor",
  description: "Confira todos os ganhadores dos vale compras de R$ 50 na Roleta da Sorte Mimo e Cor!",
  openGraph: {
    title: "🏆 Galeria de Ganhadores - Mimo e Cor",
    description: "Confira todos os sortudos que já ganharam prêmios incríveis!",
    type: "website",
    locale: "pt_BR",
    siteName: "Roleta Mimo e Cor",
  }
}

export default function WinnersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-background pb-12">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Image
              src="/images/mimo-20e-20cor-20logotipo-20006.png"
              alt="Mimo e Cor"
              width={50}
              height={50}
              className="rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Galeria de Ganhadores</h1>
              <p className="text-xs text-muted">Roleta Mimo e Cor</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-primary mb-2">🎉 Hall da Fama 🎉</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
                Confira os sortudos que já ganharam prêmios incríveis em nossas campanhas! 
                Participe você também e seja o próximo a aparecer aqui.
            </p>
        </div>

        <WinnersGallery />
      </main>
    </div>
  )
}
