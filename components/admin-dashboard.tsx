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
  getSpinHistory, // Import da função getSpinHistory
  generateTestParticipants, // Import da função de teste
} from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Power, PowerOff, LogOut, RefreshCw, Trophy, Home, Trash2, Download, X, ChevronLeft, ChevronRight, Phone, Gift } from "lucide-react" // Adicionado X icon
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialStats.totalSpins / 10))
  const itemsPerPage = 10
  const router = useRouter()

  const fetchPage = async (page: number) => {
    setLoading(true)
    const offset = (page - 1) * itemsPerPage
    const result = await getSpinHistory(itemsPerPage, offset)
    
    if (result.error) {
      alert("Erro ao carregar página: " + result.error)
    } else if (result.data) {
      setSpins(result.data)
      setCurrentPage(page)
      if (result.total) {
        setTotalPages(Math.ceil(result.total / itemsPerPage))
      }
    }
    setLoading(false)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchPage(currentPage - 1)
    }
  }

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token")
      console.log("[v0] getAuthToken lendo do localStorage:", token)
      return token || undefined
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

    alert("Campanha ativada com sucesso! Recarregue a página para ver as mudanças.")
    setLoading(false)
    window.location.reload()
  }

  const handleDeactivate = async () => {
    console.log("[v0] Botão desativar clicado")

    // Removido prompt confuso que causava exclusão acidental de dados.
    // Desativar agora APENAS desativa a campanha. Para limpar dados, use a Zona de Perigo.
    
    const confirmDeactivate = window.confirm("Deseja realmente encerrar a campanha atual?");
    if (!confirmDeactivate) return;

    setLoading(true)
    const token = getAuthToken()
    // Passamos false para cleanup para garantir que NADA seja deletado
    const result = await deactivateCampaignWithCleanup(false, token)
    console.log("[v0] Resultado da desativação:", result)

    if (result.error) {
      alert("Erro: " + result.error)
    } else {
      alert("✅ Campanha encerrada com sucesso! Os dados do ganhador foram preservados.")
    }

    setLoading(false)
    window.location.reload()
  }

  const handleLogout = async () => {
    localStorage.removeItem("admin_token")
    window.location.href = "/admin/login"
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

  const handleGenerateTest = async () => {
    if (!stats.campaign?.is_active) {
        alert("Ative a campanha primeiro para gerar participantes!")
        return
    }
    
    setLoading(true)
    const token = getAuthToken()
    const result = await generateTestParticipants(token)
    
    if (result.error) {
      alert("Erro: " + result.error)
    } else {
      alert("✅ " + result.message)
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
                <div className="relative overflow-hidden p-8 bg-white dark:bg-zinc-900 rounded-xl border-2 border-yellow-400 shadow-lg">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Trophy className="w-32 h-32 text-yellow-500" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">Ação Necessária</span>
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                        Pronto para realizar o sorteio?
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 max-w-lg text-lg">
                        Temos <strong className="text-yellow-600 dark:text-yellow-400">{stats.totalSpins} participantes</strong> concorrendo. 
                        O sistema escolherá um ganhador aleatoriamente.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleDrawWinner}
                      disabled={loading}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 text-lg px-8 py-6 h-auto font-bold rounded-xl flex items-center gap-3"
                    >
                      <Trophy className="w-6 h-6" />
                      SORTEAR GANHADOR
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
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2">
                 <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                 <h3 className="font-bold text-blue-800 dark:text-blue-300">Dados da Campanha</h3>
              </div>
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Exportar Lista de Participantes
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                      Baixe o arquivo CSV completo contendo os nomes e telefones dos <strong>{stats.totalSpins} participantes</strong>. 
                      Ideal para importar em ferramentas de marketing ou CRM.
                    </p>
                </div>
                <Button
                    size="lg"
                    onClick={handleExportCSV}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow hover:shadow-lg transition-all px-6 py-5 h-auto font-bold rounded-lg shrink-0"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    BAIXAR CSV
                  </Button>
              </div>
            </div>
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

            <Card className="border-2 border-border overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Trophy className="w-4 h-4 text-yellow-300" />
                    Ganhador
                </h3>
              </div>
              
              <CardContent className="p-6 flex-1 flex flex-col justify-center">
                {stats.winner ? (
                  <div className="space-y-4">
                    <div>
                        <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                            {stats.winner.players.name}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700">
                      <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full shrink-0">
                          <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">
                        {stats.winner.players.phone}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-zinc-700">
                       <p className="text-xs text-muted mb-1 flex items-center gap-1">
                         <Gift className="w-3 h-3" /> Prêmio
                       </p>
                       <p className="text-sm font-semibold text-green-600 dark:text-green-400">R$ 50 Vale Compras</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="w-10 h-10 text-gray-200 dark:text-zinc-700 mx-auto mb-2" />
                    <p className="text-gray-400 font-medium">Aguardando sorteio</p>
                  </div>
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
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900 shadow-sm overflow-hidden mt-8">
               <div className="bg-red-50 dark:bg-red-950/30 px-6 py-4 border-b border-red-100 dark:border-red-900 flex items-center gap-2">
                 <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                 <h3 className="font-bold text-red-800 dark:text-red-300">Zona de Perigo</h3>
              </div>
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                   <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      Resetar Banco de Dados
                   </h4>
                   <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm">
                      Esta ação irá <strong>deletar permanentemente</strong> todos os {stats.totalSpins} participantes e registros de giros.
                      Certifique-se de ter exportado o CSV antes de prosseguir.
                   </p>
                </div>
                <Button
                    size="lg"
                    onClick={handleClearDatabase}
                    disabled={loading}
                    variant="destructive"
                    className="gap-2 font-bold px-6 h-auto py-4 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                    LIMPAR BANCO
                  </Button>
              </div>
            </div>
          )}

          {/* Recent Spins */}
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Todos os Participantes ({stats.totalSpins})</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Página {currentPage} de {Math.max(1, totalPages)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
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
                          {(currentPage - 1) * itemsPerPage + index + 1}
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
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Pagination Controls */}
              {stats.totalSpins > itemsPerPage && (
                <div className="flex justify-center items-center gap-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || loading}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <span className="text-sm font-medium">
                    Página {currentPage} de {Math.max(1, totalPages)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages || loading}
                    className="gap-2"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Ferramentas de Teste */}
          <div className="flex justify-center mt-8 pb-12">
            <Button 
                variant="outline" 
                onClick={handleGenerateTest} 
                disabled={loading || !isActive}
                className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
                <RefreshCw className="w-4 h-4" />
                Gerar 10 Participantes de Teste
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
