import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { TENANT_ID } from "@/lib/config"

export const dynamic = 'force-dynamic' // Desativa cache

export async function POST(request: Request) {
  try {
    console.log("[API] Sorteio de Emergência iniciado")
    const supabase = await createClient()

    // 1. Buscar participantes (MODO FALLBACK DIRETO)
    const { data: eligiblePlayers, error: playersError } = await supabase
        .from("players")
        .select("id, name, phone")
        .eq("tenant_id", TENANT_ID)
        .order("created_at", { ascending: false })
        .limit(100) // Aumentei para 100 para garantir

    if (playersError) {
        return NextResponse.json({ error: "Erro ao buscar jogadores: " + playersError.message }, { status: 500 })
    }

    if (!eligiblePlayers || eligiblePlayers.length === 0) {
        return NextResponse.json({ error: "Nenhum participante encontrado no banco de dados!" }, { status: 400 })
    }

    // 2. Realizar o Sorteio
    const randomIndex = Math.floor(Math.random() * eligiblePlayers.length)
    const winnerPlayer = eligiblePlayers[randomIndex]
    
    // 3. Buscar ou Criar Campanha
    let { data: campaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let campaignId = campaign?.id

    if (!campaignId) {
        const { data: newCampaign } = await supabase
            .from("campaigns")
            .insert({
                tenant_id: TENANT_ID,
                name: "Sorteio de Emergência API",
                is_active: false
            })
            .select()
            .single()
        campaignId = newCampaign?.id
    }

    if (!campaignId) throw new Error("Falha crítica ao definir campanha")

    // 4. Registrar Spin Vencedor
    let { data: winnerSpin } = await supabase
      .from("spins")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .eq("player_id", winnerPlayer.id)
      .eq("campaign_id", campaignId)
      .maybeSingle()

    if (!winnerSpin) {
        const { data: newSpin } = await supabase
          .from("spins")
          .insert({
            tenant_id: TENANT_ID,
            player_id: winnerPlayer.id,
            campaign_id: campaignId,
            is_winner: true,
            ip_address: "api_draw",
            user_agent: "api_draw"
          })
          .select()
          .single()
        winnerSpin = newSpin
    } else {
        await supabase
          .from("spins")
          .update({ is_winner: true })
          .eq("id", winnerSpin.id)
    }

    // 5. Atualizar Campanha
    await supabase
      .from("campaigns")
      .update({ winner_id: winnerSpin?.id, is_active: false })
      .eq("id", campaignId)

    return NextResponse.json({
      success: true,
      winner: {
        name: winnerPlayer.name,
        phone: winnerPlayer.phone
      }
    })

  } catch (error: any) {
    console.error("[API] Erro crítico:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
