"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import confetti from "canvas-confetti"

interface Prize {
  id: string
  name: string
  description: string | null
  probability: number
  color: string
  icon: string | null
}

interface WheelProps {
  prizes: Prize[]
  onSpin: (prizeId: string) => Promise<{ isWinner: boolean; prize: Prize }>
  disabled?: boolean
}

const motivationalMessages = [
  "Não foi desta vez! Você está concorrendo ao sorteio de R$ 50!",
  "Você está participando! No final, sortearemos 1 ganhador!",
  "Participação confirmada! Aguarde o resultado do sorteio!",
  "Você está concorrendo! Boa sorte no sorteio final!",
  "Registrado! Fique atento ao resultado do sorteio!",
]

export function Wheel({ prizes, onSpin, disabled }: WheelProps) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ isWinner: boolean; prize: Prize; message?: string } | null>(null)
  const spinSoundRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio("/sounds/wheel-spin.mp3")
    audio.volume = 0.5
    audio.preload = "auto"

    spinSoundRef.current = audio

    return () => {
      audio.remove()
    }
  }, [])

  const fireConfetti = () => {
    const duration = 5000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)
  }

  const handleSpin = async () => {
    // Definir prêmios efetivos antes de checar se está vazio
    const effectivePrizes = prizes.length > 0 ? prizes : [{ id: 'dummy', name: 'R$ 50', probability: 100 } as Prize]
    
    console.log("[v0] handleSpin clicado. Spinning:", spinning, "Disabled:", disabled, "Prizes:", effectivePrizes.length)

    if (spinning || disabled) {
      console.log("[v0] Giro bloqueado: já girando ou desabilitado")
      return
    }

    setSpinning(true)
    setResult(null)

    // Tentar tocar o som sem bloquear a execução
    if (spinSoundRef.current) {
      spinSoundRef.current.currentTime = 0
      spinSoundRef.current.play().catch((e) => console.log("Erro ao tocar som:", e))
    }

    const prize = effectivePrizes[0]
    const targetRotation = 360 * 8 + Math.random() * 360

    setRotation(targetRotation)

    setTimeout(async () => {
      const response = await onSpin(prize.id)

      if (response.isWinner) {
        fireConfetti()
      }

      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
      setResult({
        isWinner: response.isWinner,
        prize,
        message: randomMessage,
      })
      setSpinning(false)
    }, 5000)
  }

  return (
    <div className="flex flex-col items-center gap-4 md:gap-8 w-full px-4">
      {/* Wheel Container */}
      <div className="relative w-full max-w-[500px]">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="w-0 h-0 border-l-[20px] md:border-l-[28px] border-l-transparent border-r-[20px] md:border-r-[28px] border-r-transparent border-t-[30px] md:border-t-[42px] border-t-yellow-400 drop-shadow-2xl" />
        </div>

        <div
          onClick={handleSpin}
          className={`relative w-full aspect-square max-w-[500px] rounded-full shadow-2xl overflow-visible border-[12px] md:border-[16px] border-yellow-400 bg-gradient-to-br from-pink-500 via-primary to-pink-600 ${
            !disabled && !spinning ? "cursor-pointer hover:scale-105 hover:shadow-pink-500/50" : "cursor-not-allowed"
          } transition-all duration-300`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "transform 0.3s ease",
            boxShadow:
              "0 30px 60px -12px rgba(0, 0, 0, 0.35), 0 0 0 6px rgba(255, 255, 255, 0.6), inset 0 2px 20px rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* Prize Display - Layout vertical otimizado */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-8 gap-0.5 md:gap-1">
            {/* Ícone do presente no topo */}
            <div className="text-3xl md:text-5xl lg:text-6xl drop-shadow-2xl">🎁</div>

            {/* VALE COMPRAS com fonte menor */}
            <p className="text-white font-black text-lg md:text-2xl lg:text-3xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] leading-tight tracking-wide uppercase whitespace-nowrap">
              VALE COMPRAS
            </p>

            {/* Círculo central menor */}
            <div className="relative w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 rounded-full border-3 md:border-4 border-white shadow-2xl flex items-center justify-center z-10 my-1 md:my-2">
              <span className="text-2xl md:text-3xl lg:text-4xl animate-pulse">🎯</span>
            </div>

            {/* Valor R$ 50 com fonte menor */}
            <p className="text-yellow-300 font-black text-3xl md:text-5xl lg:text-6xl drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] tracking-wider [text-shadow:_2px_2px_0_rgb(0_0_0_/_50%)] md:[text-shadow:_3px_3px_0_rgb(0_0_0_/_50%)]">
              R$ 50
            </p>

            {/* Nome da marca com fonte menor */}
            <p className="text-white/95 font-bold text-base md:text-lg lg:text-xl drop-shadow-lg tracking-wide">
              Mimo e Cor
            </p>
          </div>
        </div>

        {!disabled && !spinning && (
          <div className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 text-center w-full">
            <p className="text-muted-foreground text-xs md:text-sm font-semibold animate-pulse">
              👆 Clique na roleta para girar!
            </p>
          </div>
        )}
      </div>

      <Button
        size="lg"
        onClick={handleSpin}
        disabled={spinning || disabled}
        className="w-full max-w-md bg-gradient-to-r from-primary to-pink-600 hover:from-pink-600 hover:to-primary text-white font-black px-6 md:px-12 py-5 md:py-7 text-lg md:text-2xl rounded-2xl md:rounded-3xl shadow-2xl hover:shadow-pink-500/50 transition-all disabled:opacity-50 hover:scale-105 border-4 border-white mt-8 md:mt-4"
      >
        {spinning ? (
          <span className="flex items-center justify-center gap-2 md:gap-3">
            <span className="animate-spin text-xl md:text-2xl">🎰</span>
            <span className="text-base md:text-xl">GIRANDO...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2 md:gap-3">
            <span className="text-xl md:text-2xl">🎯</span>
            <span className="text-base md:text-xl">GIRAR AGORA!</span>
          </span>
        )}
      </Button>
    </div>
  )
}
