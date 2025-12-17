import { checkAdminAuth, getCampaignStats, getSpinHistory } from "@/app/actions"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  try {
    const authCheck = await checkAdminAuth()

    if (!authCheck.isAuthenticated) {
      redirect("/admin/login")
    }

    const stats = await getCampaignStats()
    const result = await getSpinHistory(100)
    const spins = result.data || []

    return <AdminDashboard stats={stats} spins={spins} />
  } catch (error) {
    if ((error as Error & { digest?: string })?.digest === "NEXT_REDIRECT") {
      throw error
    }

    console.error("[v0] AdminPage falhou ao carregar:", error)

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-4 text-center border border-border bg-card rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold">Erro ao carregar o admin</h1>
          <p className="text-muted-foreground">
            Não foi possível inicializar o painel administrativo agora. Verifique se as variáveis de ambiente do
            Supabase estão configuradas corretamente (URL e chave) e tente novamente.
          </p>
          <p className="text-sm text-muted-foreground">
            Se o problema persistir, consulte os logs do servidor para detalhes do erro.
          </p>
        </div>
      </div>
    )
  }
}
