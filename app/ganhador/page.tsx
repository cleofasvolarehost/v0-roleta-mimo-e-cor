import { getAllWinners } from "@/app/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export const metadata = {
  title: "Ganhadores da Roleta da Sorte - Mimo e Cor",
  description: "Confira todos os ganhadores dos vale compras de R$ 50 na Roleta da Sorte Mimo e Cor!",
  openGraph: {
    title: "🏆 Ganhadores da Roleta da Sorte - Mimo e Cor",
    description: "Confira todos os ganhadores dos vale compras de R$ 50 na Roleta da Sorte Mimo e Cor!",
    type: "website",
    locale: "pt_BR",
    siteName: "Roleta Mimo e Cor",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mimo e Cor - Ganhadores da Roleta da Sorte",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "🏆 Ganhadores da Roleta da Sorte - Mimo e Cor",
    description: "Confira todos os ganhadores dos vale compras de R$ 50!",
    images: ["/og-image.jpg"],
  },
}

export default async function WinnersPage() {
  const winners = await getAllWinners()

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
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div className="text-center space-y-3 md:space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
              {winners.length === 0
                ? "Ainda não há ganhadores"
                : winners.length === 1
                  ? "Ganhador da "
                  : "Ganhadores da "}
              <span className="text-primary">Roleta da Sorte</span> 🏆
            </h1>
            <p className="text-base md:text-lg text-muted">
              {winners.length === 0
                ? "Aguarde o primeiro sorteio!"
                : `Vale Compra de R$ 50 em produtos Mimo e Cor - ${winners.length} ${winners.length === 1 ? "campanha realizada" : "campanhas realizadas"}`}
            </p>
          </div>

          {winners.length === 0 ? (
            <Card className="border-2 border-border">
              <CardContent className="py-12 md:py-16 text-center px-4">
                <div className="text-6xl md:text-8xl mb-4 md:mb-6">🎯</div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Ainda não há ganhadores!</h2>
                <p className="text-muted text-base md:text-lg mb-6 md:mb-8">
                  Aguarde a próxima campanha e participe da roleta da sorte para concorrer ao prêmio de R$ 50 em vale
                  compra.
                </p>
                <Link href="/">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-accent text-white font-bold px-6 md:px-8 py-5 md:py-6 text-base md:text-lg"
                  >
                    Voltar ao Início
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {winners.map((winnerData, index) => (
                <Card key={winnerData.campaign.id} className="border-4 border-primary shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-accent p-6 md:p-8 text-white text-center">
                    <div className="text-5xl md:text-7xl mb-3 md:mb-4 animate-bounce">🎉</div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">PARABÉNS!</h2>
                    <p className="text-lg md:text-xl opacity-90">
                      {winnerData.campaign.name || `Campanha ${index + 1}`}
                    </p>
                  </div>
                  <CardHeader className="pb-4 pt-6 md:pt-8">
                    <div className="flex flex-col items-center gap-3 md:gap-4">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-4xl md:text-5xl">👤</span>
                      </div>
                      <CardTitle className="text-3xl md:text-4xl font-bold text-center text-primary break-words max-w-full px-4">
                        {winnerData.winner.players.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center space-y-4 md:space-y-6 pb-6 md:pb-8 px-4">
                    <div className="bg-surface rounded-2xl p-6 md:p-8 border-2 border-border">
                      <p className="text-muted mb-2 text-base md:text-lg">Prêmio</p>
                      <p className="text-4xl md:text-5xl font-bold text-primary mb-2">R$ 50</p>
                      <p className="text-lg md:text-xl font-semibold">Vale Compra</p>
                      <p className="text-xs md:text-sm text-muted mt-3">Para usar em qualquer produto Mimo e Cor</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
                        <p className="text-xs md:text-sm text-muted mb-2">🎊 Sorteado em</p>
                        <p className="text-sm md:text-base font-semibold">
                          {new Date(winnerData.winner.spun_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-700">
                        <p className="text-xs md:text-sm text-muted mb-2">👥 Participantes</p>
                        <p className="text-sm md:text-base font-semibold">
                          {winnerData.totalParticipants} {winnerData.totalParticipants === 1 ? "pessoa" : "pessoas"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-4 border border-yellow-300 dark:border-yellow-700">
                      <p className="text-xs md:text-sm text-muted">
                        Telefone: <span className="font-semibold">{winnerData.winner.players.phone}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="border-2 border-border bg-muted/30">
                <CardContent className="py-6 md:py-8 text-center space-y-3 px-4">
                  <p className="text-base md:text-lg font-semibold">💡 Fique atento às próximas campanhas!</p>
                  <p className="text-sm md:text-base text-muted">
                    Siga nossas redes sociais para não perder nenhuma promoção da Mimo e Cor.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="text-center pt-4">
            <Link href="/">
              <Button
                size="lg"
                variant="outline"
                className="px-8 md:px-10 py-5 md:py-6 text-base md:text-lg bg-transparent"
              >
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
