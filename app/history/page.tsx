import { getCampaignStats } from "@/app/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default async function HistoryPage() {
  const stats = await getCampaignStats()
  const winner = stats.winner

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <Image
            src="/images/mimo-20e-20cor-20logotipo-20006.png"
            alt="Mimo e Cor"
            width={80}
            height={80}
            className="h-12 w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Ganhador da <span className="text-primary">Roleta</span> 🏆
            </h1>
            <p className="text-lg text-muted">Vale Compra de R$ 50 em produtos Mimo e Cor!</p>
          </div>

          {!winner ? (
            <Card className="border-2 border-border">
              <CardContent className="py-16 text-center">
                <div className="text-8xl mb-6">🎯</div>
                <h2 className="text-3xl font-bold mb-4">Ainda não há ganhador!</h2>
                <p className="text-muted text-lg mb-8">
                  Participe da roleta da sorte e concorra ao prêmio de R$ 50 em vale compra!
                </p>
                <Link href="/wheel">
                  <Button size="lg" className="bg-primary hover:bg-accent text-white font-bold px-8 py-6 text-lg">
                    Participar Agora! 🎰
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="border-4 border-primary shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-accent p-8 text-white text-center">
                  <div className="text-7xl mb-4 animate-bounce">🎉</div>
                  <h2 className="text-4xl font-bold mb-2">PARABÉNS!</h2>
                  <p className="text-xl opacity-90">ao nosso ganhador</p>
                </div>
                <CardHeader className="pb-4 pt-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-5xl">👤</span>
                    </div>
                    <CardTitle className="text-4xl font-bold text-center text-primary">{winner.players.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-center space-y-6 pb-8">
                  <div className="bg-surface rounded-2xl p-8 border-2 border-border">
                    <p className="text-muted mb-2 text-lg">Prêmio</p>
                    <p className="text-5xl font-bold text-primary mb-2">R$ 50</p>
                    <p className="text-xl font-semibold">Vale Compra</p>
                    <p className="text-sm text-muted mt-3">Para usar em qualquer produto Mimo e Cor</p>
                  </div>

                  <div className="text-sm text-muted">
                    Sorteado em{" "}
                    {new Date(winner.spun_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border bg-muted/30">
                <CardContent className="py-8 text-center">
                  <p className="text-lg mb-4">💡 Fique atento às próximas campanhas!</p>
                  <p className="text-muted">Entre em contato conosco para mais informações sobre promoções futuras.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {stats.totalSpins > 0 && (
            <Card className="border-2 border-border">
              <CardContent className="py-6 text-center">
                <p className="text-muted">
                  Total de participantes: <span className="font-bold text-foreground">{stats.totalSpins}</span>
                </p>
              </CardContent>
            </Card>
          )}

          <div className="text-center pt-4">
            <Link href="/">
              <Button size="lg" variant="outline" className="px-10 py-6 text-lg bg-transparent">
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
