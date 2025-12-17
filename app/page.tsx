import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-background flex flex-col">
      {/* Header compacto */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/mimo-20e-20cor-20logotipo-20006.png"
              alt="Mimo e Cor"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <h1 className="text-base font-bold text-foreground">Mimo e Cor</h1>
              <p className="text-xs text-muted">Roleta da Sorte</p>
            </div>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="text-xs px-3 py-1 bg-transparent">
              Admin
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-md space-y-4">
          {/* Badge e título compactos */}
          <div className="text-center space-y-2">
            <div className="inline-block px-3 py-1 bg-primary/10 rounded-full">
              <p className="text-primary font-semibold text-xs">Concorra a R$ 50!</p>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-balance leading-tight">
              Gire a Roleta e <span className="text-primary">Ganhe</span>
            </h2>

            <p className="text-sm text-muted">Cadastre-se e gire para concorrer ao vale compra!</p>
          </div>

          {/* Info cards compactos */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-card rounded-lg border border-border">
              <div className="text-xl mb-0.5">🎁</div>
              <p className="text-xs font-semibold text-foreground">R$ 50</p>
            </div>
            <div className="text-center p-2 bg-card rounded-lg border border-border">
              <div className="text-xl mb-0.5">⚡</div>
              <p className="text-xs font-semibold text-foreground">Rápido</p>
            </div>
            <div className="text-center p-2 bg-card rounded-lg border border-border">
              <div className="text-xl mb-0.5">🎯</div>
              <p className="text-xs font-semibold text-foreground">1 Chance</p>
            </div>
          </div>

          {/* Mascote menor */}
          <div className="flex justify-center py-2">
            <Image
              src="/images/mimo-20e-20cor-20mascote-20002.png"
              alt="Mimo e Cor Mascote"
              width={120}
              height={120}
              className="drop-shadow-xl"
              priority
            />
          </div>

          {/* Botão principal destacado */}
          <Link href="/wheel" className="block">
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold px-6 py-6 text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all animate-pulse-slow"
            >
              🎯 GIRAR ROLETA AGORA!
            </Button>
          </Link>

          {/* Ver ganhadores secundário */}
          <Link href="/ganhador" className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-2 border-primary/30 text-primary hover:bg-primary hover:text-white font-semibold rounded-lg transition-all bg-transparent"
            >
              Ver Ganhadores
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="border-t border-border bg-card py-2">
        <div className="container mx-auto px-4 text-center text-muted text-xs">
          <p>&copy; 2025 Mimo e Cor</p>
        </div>
      </footer>
    </div>
  )
}
