"use client"

import { useState, useEffect } from "react"
import { Wheel } from "@/components/wheel"
import { RegistrationForm } from "@/components/registration-form"
import { registerPlayer, getPrizes, recordSpin, getActiveCampaign } from "@/app/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { generateDeviceFingerprint } from "@/lib/device-fingerprint"

interface Player {
  id: string
  name: string
  email: string
}

interface Prize {
  id: string
  name: string
  description: string | null
  probability: number
  color: string
  icon: string | null
}

export default function WheelPage() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [hasSpun, setHasSpun] = useState(false)
  const [loading, setLoading] = useState(true)
  const [campaignActive, setCampaignActive] = useState(false)
  const [error, setError] = useState("")
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("")
  const [result, setResult] = useState<{ isWinner: boolean; prize: Prize; message?: string } | null>(null)

  useEffect(() => {
    const fingerprint = generateDeviceFingerprint()
    setDeviceFingerprint(fingerprint)
    loadData()
  }, [])

  const loadData = async () => {
    const campaignResult = await getActiveCampaign()
    if (campaignResult.data) {
      setCampaignActive(true)
    } else {
      setCampaignActive(false)
    }

    const result = await getPrizes()
    if (result.data) {
      setPrizes(result.data as Prize[])
    }
    setLoading(false)
  }

  const handleRegister = async (data: { name: string; phone: string; deviceFingerprint?: string }) => {
    const result = await registerPlayer(data)
    if (result.error) {
      throw new Error(result.error)
    }
    if (result.data) {
      setPlayer(result.data as Player)
    }
  }

  const handleSpin = async (prizeId: string): Promise<{ isWinner: boolean; prize: Prize }> => {
    const dummyPrize: Prize = { id: 'dummy', name: 'R$ 50', description: null, probability: 100, color: '#FFD700', icon: null }
    const currentPrize = prizes.length > 0 ? prizes[0] : dummyPrize

    if (!player) return { isWinner: false, prize: currentPrize }

    // Se for dummy, não tentar gravar no banco (vai dar erro de UUID)
    // A menos que a gente queira tratar isso no backend. 
    // Por enquanto, vamos assumir que se é dummy, é só visual ou erro.
    
    let result;
    if (prizeId === 'dummy') {
        console.log("[v0] Girando com prêmio dummy (sem gravação no banco)")
        // Simular um resultado não-vencedor para evitar erros de banco
        result = { error: null, isWinner: false } 
    } else {
        result = await recordSpin(player.id, prizeId, deviceFingerprint)
    }

    if (result.error) {
      setError(result.error)
      setHasSpun(true)
      return { isWinner: false, prize: currentPrize }
    }

    setHasSpun(true)
    const motivationalMessages = [
      "Não foi desta vez! Você está concorrendo ao sorteio de R$ 50!",
      "Você está participando! No final, sortearemos 1 ganhador!",
      "Participação confirmada! Aguarde o sorteio do prêmio!",
      "Você está concorrendo! Boa sorte no sorteio final!",
      "Registrado! Fique atento ao resultado do sorteio!",
    ]
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

    setResult({
      isWinner: result.isWinner || false,
      prize: currentPrize,
      message: randomMessage,
    })

    return { isWinner: result.isWinner || false, prize: currentPrize }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface to-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎯</div>
          <p className="text-muted text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!campaignActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface to-background">
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

        <main className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 max-w-2xl">
            <div className="text-8xl mb-4">⏰</div>
            <h1 className="text-4xl font-bold text-foreground">Campanha Inativa</h1>
            <p className="text-xl text-muted">
              A roleta da sorte não está disponível no momento. Aguarde o administrador ativar uma nova campanha!
            </p>
            <Link href="/">
              <Button size="lg" className="bg-primary hover:bg-accent text-white font-bold mt-6">
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

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
      <main className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {!player ? (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <Image
                    src="/images/mimo-20e-20cor-20mascote-20002.png"
                    alt="Mascote Mimo e Cor"
                    width={120}
                    height={120}
                    className="w-24 md:w-32 h-auto"
                  />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold text-balance leading-tight">
                  Roleta da <span className="text-primary">Sorte</span>
                </h1>
                <p className="text-sm md:text-base text-muted max-w-md mx-auto px-2">
                  Cadastre-se e concorra a um <span className="text-primary font-bold">Vale Compra de R$ 50</span> na
                  Mimo e Cor!
                </p>
              </div>
              <RegistrationForm onRegister={handleRegister} />
            </div>
          ) : (
            <div className="space-y-8">
              {result && hasSpun && (
                <div
                  className={`p-10 rounded-3xl text-white text-center shadow-2xl animate-in fade-in slide-in-from-top-8 duration-700 border-4 ${
                    result.isWinner
                      ? "bg-gradient-to-br from-green-500 via-green-600 to-green-700 border-yellow-400"
                      : "bg-gradient-to-br from-primary via-pink-600 to-pink-700 border-pink-300"
                  }`}
                >
                  <div className="text-8xl mb-6 animate-bounce">{result.isWinner ? "🏆" : "🎉"}</div>

                  {result.isWinner ? (
                    <>
                      <h3 className="text-6xl font-black mb-6 tracking-wide uppercase animate-pulse">
                        PARABÉNS! VOCÊ GANHOU!
                      </h3>
                      <p className="text-3xl font-bold mb-6">🎊 Você é o grande vencedor! 🎊</p>
                      <div className="bg-yellow-300 text-gray-900 rounded-2xl p-8 my-6 border-4 border-yellow-500">
                        <p className="text-7xl font-black mb-3">R$ 50</p>
                        <p className="text-2xl font-bold">Vale Compras Mimo e Cor</p>
                      </div>
                      <div className="bg-white/20 rounded-xl p-6 mt-6 backdrop-blur-sm">
                        <p className="text-2xl font-bold mb-3">🎁 Como retirar seu prêmio?</p>
                        <p className="text-lg leading-relaxed">
                          Entraremos em contato pelo telefone cadastrado para combinar a entrega do seu vale compras!
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-5xl font-black mb-6 tracking-wide">Participação Registrada!</h3>
                      <p className="text-2xl font-bold mb-4">✅ Você está concorrendo ao sorteio!</p>
                      <div className="bg-yellow-300 text-gray-900 rounded-2xl p-6 my-6">
                        <p className="text-6xl font-black mb-2">R$ 50</p>
                        <p className="text-xl font-bold">Vale Compras</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-5 mt-5">
                        <p className="text-xl font-semibold mb-3">📢 Como funciona o sorteio?</p>
                        <p className="text-base text-white/95 leading-relaxed">
                          Ao final da campanha (1 hora), sortearemos 1 GANHADOR entre todos os participantes. Se você
                          for sorteado, entraremos em contato pelo telefone cadastrado!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="text-center space-y-4 bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border">
                <h1 className="text-3xl md:text-4xl font-bold">
                  Olá, <span className="text-primary">{player.name}</span>! 👋
                </h1>
                {!hasSpun ? (
                  <p className="text-lg text-muted">
                    Você tem <span className="text-primary font-bold">1 chance</span> de girar a roleta e concorrer ao
                    prêmio!
                  </p>
                ) : error ? (
                  <div className="space-y-2">
                    <p className="text-lg text-destructive font-semibold">❌ {error}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg text-primary font-semibold">✓ Você já participou!</p>
                    <p className="text-muted">Aguarde o resultado do sorteio</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Wheel prizes={prizes} onSpin={handleSpin} disabled={hasSpun} />
              </div>

              {hasSpun && (
                <div className="text-center space-y-4 mt-8">
                  <Link href="/">
                    <Button size="lg" className="bg-primary hover:bg-accent text-white font-bold">
                      Voltar ao Início
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
