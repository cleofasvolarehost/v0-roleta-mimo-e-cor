"use client"

import { useState } from "react"
import {
  activateCampaign,
  deactivateCampaignWithCleanup,
  adminLogout,
  drawWinner,
  clearParticipants,
  deleteParticipant, // Import da nova função
  exportParticipantsCSV, // Import da função exportParticipantsCSV
} from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Power, PowerOff, LogOut, RefreshCw, Trophy, Home, Trash2, Download, X } from "lucide-react" // Adicionado X icon
import CampaignTimer from "@/components/campaign-timer" // Import da nova função

interface AdminDashboardProps {
  stats: {
    campaign: any
    totalSpins: number
    winner: any
  }
  spins: any[]
}

export function AdminDashboard({ stats: initialStats, spins: initialSpins }: AdminDashboardProps) {
  const [stats, setStats] = useState(initialStats)
  const [spins, setSpins] = useState(initialSpins)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_session") || undefined
      console.log("[v0] getAuthToken retornando:", token)
      return token
    }
    return undefined
  }

  const handleActivate = async () => {
    console.log("[v0] Botão ativar clicado")
    setLoading(true)
    const token = getAuthToken()
    console.log("[v0] Token sendo enviado para activateCampaign:", token)
    const result = await activateCampaign(token)
    console.log("[v0] Resultado da ativação:", result)

    if (result.error) {
      alert("Erro ao ativar campanha: " + result.error)
      setLoading(false)
      return
    }

    if (result.data) {
      setStats({
        ...stats,
        campaign: result.data,
      })
    }

    alert("Campanha ativada com sucesso! Recarregue a página para ver as mudanças.")
    setLoading(false)

    window.location.reload()
  }

  const handleDeactivate = async () => {
    console.log("[v0] Botão desativar clicado")

    // Perguntar se deseja limpar participantes
    const shouldClear = window.confirm(
      "Deseja limpar os participantes ao desativar a campanha?\n\n" +
        "✅ SIM - Remove todos os participantes da lista\n" +
        "❌ NÃO - Mantém os participantes no banco",
    )

    setLoading(true)
    const token = getAuthToken()
    const result = await deactivateCampaignWithCleanup(shouldClear, token)
    console.log("[v0] Resultado da desativação:", result)

    if (result.error) {
      alert("Erro: " + result.error)
    } else {
      if (result.cleared) {
        alert("✅ Campanha desativada e participantes limpos com sucesso!")
      } else {
        alert("✅ Campanha desativada com sucesso!")
      }
    }

    setLoading(false)
    window.location.reload()
  }

  const handleLogout = async () => {
    await adminLogout()
    router.push("/admin/login")
    router.refresh()
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleDrawWinner = async () => {
    if (!stats.campaign) {
      alert("Nenhuma campanha ativa")
      return
    }

    if (stats.campaign.winner_id) {
      alert("Esta campanha já tem um ganhador!")
      return
    }

    if (stats.totalSpins === 0) {
      alert("Nenhum participante para sortear!")
      return
    }

    const confirm = window.confirm(
      `Tem certeza que deseja sortear o ganhador agora? Há ${stats.totalSpins} participante(s) concorrendo.`,
    )

    if (!confirm) return

    setLoading(true)
    const token = getAuthToken()
    const result = await drawWinner(stats.campaign.id, token)

    if (result.error) {
      alert("Erro ao sortear: " + result.error)
    } else if (result.success && result.winner) {
      alert(`🎉 Ganhador sorteado: ${result.winner.name}!`)
      window.location.reload()
    }

    setLoading(false)
  }

  const handleClearDatabase = async () => {
    const confirm = window.confirm(
      `⚠️ ATENÇÃO! Esta ação irá deletar TODOS os ${stats.totalSpins} participantes e seus giros.\n\nEsta ação NÃO pode ser desfeita!\n\nTem certeza que deseja continuar?`,
    )

    if (!confirm) return

    const doubleConfirm = window.confirm("Confirme novamente: Você realmente deseja DELETAR TODOS OS PARTICIPANTES?")

    if (!doubleConfirm) return

    setLoading(true)
    const token = getAuthToken()
    const result = await clearParticipants(token)

    if (result.error) {
      alert("Erro ao limpar banco de dados: " + result.error)
    } else {
      alert("✅ Banco de dados limpo com sucesso! Todos os participantes foram removidos.")
      window.location.reload()
    }

    setLoading(false)
  }

  const handleExportCSV = async () => {
    if (stats.totalSpins === 0) {
      alert("Nenhum participante para exportar!")
      return
    }

    setLoading(true)
    const token = getAuthToken()
    const result = await exportParticipantsCSV(stats.campaign?.id, token)

    if (result.error) {
      alert("Erro ao exportar: " + result.error)
      setLoading(false)
      return
    }

    if (result.success && result.csv) {
      // Criar arquivo CSV e fazer download
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute("download", `participantes_mimo_cor_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert(`✅ CSV exportado com sucesso! ${result.totalParticipants} participante(s)`)
    }

    setLoading(false)
  }

  const handleDeleteParticipant = async (playerId: string, playerName: string) => {
    const confirm = window.confirm(
      `Tem certeza que deseja remover "${playerName}" da lista de participantes?\n\nEsta ação não pode ser desfeita!`,
    )

    if (!confirm) return

    setLoading(true)
    setDeletingId(playerId)
    const token = getAuthToken()
    const result = await deleteParticipant(playerId, token)

    if (result.error) {
      alert("Erro ao remover participante: " + result.error)
    } else {
      alert(`✅ ${playerName} foi removido com sucesso!`)
      window.location.reload()
    }

    setLoading(false)
  }

  const isActive = stats.campaign?.is_active || false
  const timeRemaining = stats.campaign?.ends_at
    ? Math.max(0, Math.floor((new Date(stats.campaign.ends_at).getTime() - Date.now()) / 1000 / 60))
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/images/mimo-20e-20cor-20logotipo-20006.png"
              alt="Mimo e Cor"
              width={60}
              height={60}
              className="rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
              <p className="text-sm text-muted">Controle da Roleta</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/")} className="gap-2 bg-transparent">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 bg-transparent">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Campaign Control */}
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Controle da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-surface rounded-lg border border-border gap-4">
                <div>
                  <p className="text-sm text-muted mb-1">Status da Campanha</p>
                  <p className="text-3xl font-bold">
                    {isActive ? (
                      <span className="text-green-600">Ativa ✓</span>
                    ) : (
                      <span className="text-red-600">Inativa ✗</span>
                    )}
                  </p>
                  {isActive && timeRemaining > 0 && (
                    <p className="text-sm text-muted mt-2">Tempo restante: {timeRemaining} minutos</p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Button
                    size="lg"
                    onClick={handleActivate}
                    disabled={loading || isActive}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 w-full sm:w-auto"
                  >
                    <Power className="w-5 h-5" />
                    Ativar (1 hora)
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleDeactivate}
                    disabled={loading || !isActive}
                    variant="destructive"
                    className="gap-2 font-bold w-full sm:w-auto"
                  >
                    <PowerOff className="w-5 h-5" />
                    Desativar
                  </Button>
                </div>
              </div>

              {stats.campaign && !stats.campaign.winner_id && stats.totalSpins > 0 && (
                <div className="p-6 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border-2 border-yellow-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-400 mb-2">
                        Pronto para sortear?
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-500">
                        Há {stats.totalSpins} participante(s) aguardando o sorteio. O ganhador será escolhido
                        aleatoriamente.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleDrawWinner}
                      disabled={loading}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2 font-bold w-full md:w-auto"
                    >
                      <Trophy className="w-5 h-5" />
                      Sortear Ganhador
                    </Button>
                  </div>
                </div>
              )}

              {isActive && stats.campaign?.ends_at && <CampaignTimer endsAt={stats.campaign.ends_at} />}

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-surface rounded-lg border border-border">
                  <p className="text-muted mb-1">Campanha iniciada em:</p>
                  <p className="font-semibold">
                    {stats.campaign?.started_at
                      ? new Date(stats.campaign.started_at).toLocaleString("pt-BR")
                      : "Não iniciada"}
                  </p>
                </div>
                <div className="p-4 bg-surface rounded-lg border border-border">
                  <p className="text-muted mb-1">Campanha termina em:</p>
                  <p className="font-semibold">
                    {stats.campaign?.ends_at ? new Date(stats.campaign.ends_at).toLocaleString("pt-BR") : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marketing and Exportation */}
          {stats.totalSpins > 0 && (
            <Card className="border-2 border-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Marketing e Exportação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                      Exportar dados dos participantes
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Baixe um arquivo CSV com nome e telefone de todos os {stats.totalSpins} participante(s) para usar
                      em campanhas de marketing futuras.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleExportCSV}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold w-full sm:w-auto"
                  >
                    <Download className="w-5 h-5" />
                    Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted">Total de Participantes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{stats.totalSpins}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted">Ganhador</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.winner ? (
                  <div className="space-y-3">
                    <p className="text-2xl font-bold text-green-600">🎉 {stats.winner.players.name}</p>
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-muted mb-1">Telefone para contato:</p>
                      <p className="text-xl font-mono font-bold text-green-700 dark:text-green-400">
                        {stats.winner.players.phone}
                      </p>
                    </div>
                    <p className="text-sm text-muted">R$ 50 em Vale Compra</p>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted mb-2">📞 Próximos passos:</p>
                      <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
                        <li>Ligue para o ganhador no telefone acima</li>
                        <li>Informe sobre o prêmio de R$ 50</li>
                        <li>Compartilhe o link da página do ganhador</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <p className="text-xl text-muted">Ainda não há ganhador</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="text-sm text-muted">Valor do Prêmio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">R$ 50</p>
                <p className="text-sm text-muted mt-1">Vale Compra</p>
              </CardContent>
            </Card>
          </div>

          {/* Zona de Perigo */}
          {stats.totalSpins > 0 && (
            <Card className="border-2 border-red-300 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="text-xl text-red-700 dark:text-red-400">Zona de Perigo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-300 mb-1">Limpar todos os participantes</p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Esta ação irá deletar permanentemente todos os {stats.totalSpins} participantes e seus giros. Não
                      pode ser desfeita! Exporte o CSV antes se precisar dos dados.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleClearDatabase}
                    disabled={loading}
                    variant="destructive"
                    className="gap-2 font-bold w-full sm:w-auto"
                  >
                    <Trash2 className="w-5 h-5" />
                    Limpar Banco
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Spins */}
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle>Todos os Participantes ({spins.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {spins.length === 0 ? (
                  <p className="text-muted text-center py-8">Nenhum participante ainda</p>
                ) : (
                  spins.map((spin: any, index: number) => (
                    <div
                      key={spin.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        spin.is_winner
                          ? "bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{spin.players.name}</p>
                          <p className="text-sm text-muted font-mono">{spin.players.phone}</p>
                          <p className="text-xs text-muted">
                            {new Date(spin.spun_at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {spin.is_winner && (
                          <div className="text-right">
                            <p className="text-green-600 font-bold text-lg">🎉 GANHADOR!</p>
                            <p className="text-sm text-muted">R$ 50</p>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteParticipant(spin.players.id, spin.players.name)}
                          disabled={loading || deletingId === spin.players.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Remover participante"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
