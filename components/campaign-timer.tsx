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
        setTimeout(() => window.location.reload(), 2000)
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
      className={`text-center p-4 rounded-lg ${isExpired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
    >
      <div className="text-sm font-medium">{isExpired ? "⏰ Campanha Expirada" : "⏱️ Tempo Restante"}</div>
      <div className="text-2xl font-bold mt-1">{timeRemaining}</div>
    </div>
  )
}
