"use client"

import { useEffect, useState } from "react"
import { getPastWinners } from "@/app/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Calendar, Gift, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

export function WinnersGallery() {
  const [winners, setWinners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 9 // 3x3 grid

  useEffect(() => {
    fetchWinners(1)
  }, [])

  const fetchWinners = async (page: number) => {
    setLoading(true)
    const offset = (page - 1) * itemsPerPage
    const result = await getPastWinners(itemsPerPage, offset)

    if (result.error) {
      console.error(result.error)
    } else if (result.data) {
      setWinners(result.data)
      if (result.total) {
        setTotalPages(Math.ceil(result.total / itemsPerPage))
      }
    }
    setLoading(false)
    setCurrentPage(page)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchWinners(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchWinners(currentPage - 1)
    }
  }

  // Mask phone number for privacy
  const maskPhone = (phone: string) => {
    if (!phone) return "..."
    // Returns (11) 9****-1234
    return phone.replace(/(\d{2}) \d{4,5}-(\d{4})/, "($1) 9****-$2")
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
    )
  }

  if (winners.length === 0) {
    return (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
            <Trophy className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground">Nenhum ganhador registrado ainda.</h3>
            <p className="text-sm text-muted mt-2">Participe das nossas campanhas para inaugurar esta lista!</p>
        </div>
    )
  }

  return (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {winners.map((item) => (
                <Card key={item.id} className="overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all hover:shadow-lg group">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
                            Ganhador Verificado
                        </span>
                        <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                    <CardContent className="p-6 text-center space-y-4">
                        <div>
                            <h3 className="text-2xl font-black text-foreground mb-1 group-hover:text-primary transition-colors">
                                {item.winner.name}
                            </h3>
                            <p className="text-sm font-mono text-muted-foreground">
                                {item.winner.phone} 
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-left bg-surface rounded-lg p-3 text-sm">
                            <div className="space-y-1">
                                <p className="text-xs text-muted flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Data
                                </p>
                                <p className="font-medium">
                                    {new Date(item.date).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted flex items-center gap-1">
                                    <Gift className="w-3 h-3" /> Prêmio
                                </p>
                                <p className="font-bold text-primary">
                                    {item.winner.prize}
                                </p>
                            </div>
                        </div>
                        
                        <div className="pt-2">
                                <p className="text-xs text-muted-foreground italic">
                                "{item.campaignName}"
                                </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
                <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || loading}
                    className="gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                </Button>
                <span className="text-sm font-medium bg-card px-4 py-2 rounded-lg border border-border">
                    Página {currentPage} de {totalPages}
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
    </>
  )
}
