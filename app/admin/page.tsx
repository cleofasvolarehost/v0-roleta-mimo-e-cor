import { checkAdminAuth, getCampaignStats, getSpinHistory } from "@/app/actions"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function AdminPage() {
  const authCheck = await checkAdminAuth()

  if (!authCheck.isAuthenticated) {
    redirect("/admin/login")
  }

  const stats = await getCampaignStats()
  const result = await getSpinHistory(100)
  const spins = result.data || []

  return <AdminDashboard stats={stats} spins={spins} />
}
