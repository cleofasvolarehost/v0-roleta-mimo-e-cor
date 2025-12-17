"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCampaignStats, getSpinHistory } from "@/app/actions"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [spins, setSpins] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("admin_token")

    if (token !== "authenticated") {
      router.push("/admin/login")
      return
    }

    setIsAuthenticated(true)

    // Carregar dados
    const loadData = async () => {
      try {
        const statsResult = await getCampaignStats()
        const spinsResult = await getSpinHistory(100)

        setStats(statsResult)
        setSpins(spinsResult.data || [])
      } catch (error) {
        console.error("[v0] Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted">Carregando...</p>
        </div>
      </div>
    )
  }

  return <AdminDashboard stats={stats} spins={spins} />
}
