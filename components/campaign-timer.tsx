"use client"

import { useEffect, useState } from "react"

interface CampaignTimerProps {
  endsAt: string | null
}

export default function CampaignTimer({ endsAt }: CampaignTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!endsAt) return

    const updateTimer = () => {
      const now = new Date().getTime()
      const end = new Date(endsAt).getTime()
      const distance = end - now

      if (distance < 0) {
        setTimeRemaining("Campanha expirada!")
        setIsExpired(true)
        // Removido reload automático para evitar loops infinitos
        return
      }

      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      setIsExpired(false)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endsAt])

  if (!endsAt) return null

  return (
    <div
      className={`text-center p-6 rounded-xl border-2 shadow-sm transition-all duration-300 ${
        isExpired 
          ? "bg-red-50 border-red-200 text-red-700" 
          : "bg-white border-green-400 text-green-800"
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isExpired ? "text-red-600" : "text-green-600"}`}>
          {isExpired ? (
            <>⏰ Campanha Encerrada</>
          ) : (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Tempo Restante
            </>
          )}
        </span>
        <div className="text-4xl font-black font-mono tracking-tight">{timeRemaining}</div>
      </div>
    </div>
  )
}
