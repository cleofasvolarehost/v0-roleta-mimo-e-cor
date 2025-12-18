"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { TENANT_ID } from "@/lib/config"

async function getUserIP(): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return "unknown"
}

async function getUserAgent(): Promise<string> {
  const headersList = await headers()
  return headersList.get("user-agent") || "unknown"
}

export async function registerPlayer(formData: {
  name: string
  phone: string
  deviceFingerprint?: string
}) {
  const supabase = await createClient()
  const ipAddress = await getUserIP()
  const userAgent = await getUserAgent()

  console.log("[v0] Registrando jogador - Nome:", formData.name, "Telefone:", formData.phone)

  const { data: existingByPhone } = await supabase
    .from("players")
    .select("*, spins(*)")
    .eq("tenant_id", TENANT_ID)
    .eq("phone", formData.phone)
    .single()

  if (existingByPhone) {
    // 1. Buscar campanha ativa
    const { data: activeCampaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    // Se não tiver campanha ativa, nem adianta verificar (mas o registro vai falhar depois de qualquer jeito)
    // Se tiver, vamos ver se a pessoa já girou NESSA campanha.
    if (activeCampaign) {
      const { count: spinCountInCampaign } = await supabase
        .from("spins")
        .select("*", { count: "exact", head: true })
        .eq("player_id", existingByPhone.id)
        .eq("tenant_id", TENANT_ID)
        .eq("campaign_id", activeCampaign.id)

      if (spinCountInCampaign && spinCountInCampaign > 0) {
        // Já girou NESTA campanha -> Bloqueia
        console.log("[v0] Telefone já participou desta campanha específica")
        return { error: "Este telefone já participou desta campanha!" }
      }
    }

    // Se chegou aqui, é porque:
    // A) Não girou na campanha atual (pode ter girado em antigas)
    // B) Ou tentou girar na atual mas falhou (spinCount === 0)
    
    // Em ambos os casos, precisamos permitir o novo cadastro.
    // Mas como o telefone é UNIQUE no banco, temos que deletar o registro antigo
    // para permitir criar um novo com o mesmo telefone.
    // (Isso apaga o histórico de campanhas passadas desse telefone, mas é o comportamento esperado
    // para permitir reuso do número sem mudar a estrutura do banco para many-to-many players)
    
    console.log("[v0] Telefone reencontrado (nova campanha ou retry), recriando registro...")

    // Deletar o cadastro antigo para permitir novo registro limpo na nova campanha
    const { error: deleteError } = await supabase
      .from("players")
      .delete()
      .eq("id", existingByPhone.id)
      .eq("tenant_id", TENANT_ID)

    if (deleteError) {
      console.error("[v0] Erro ao deletar cadastro antigo:", deleteError)
      // Se não conseguir deletar, o insert abaixo vai falhar com "duplicate key"
    }
  }

  // Verificar se o dispositivo já foi usado NESTA CAMPANHA
  if (formData.deviceFingerprint) {
    // 1. Buscar campanha ativa primeiro
    const { data: activeCampaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()

    if (activeCampaign) {
      // 2. Verificar se existe algum GIRO feito por este dispositivo NA campanha ativa
      // Precisamos fazer um join entre spins e players (porque o fingerprint fica no player)
      // Mas como não temos o ID do player ainda, vamos buscar players com esse fingerprint
      // e ver se algum deles tem spin na campanha atual.
      
      const { data: playersWithFingerprint } = await supabase
        .from("players")
        .select("id")
        .eq("tenant_id", TENANT_ID)
        .eq("device_fingerprint", formData.deviceFingerprint)

      if (playersWithFingerprint && playersWithFingerprint.length > 0) {
        const playerIds = playersWithFingerprint.map(p => p.id)
        
        const { count: existingSpinsInCampaign } = await supabase
          .from("spins")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", TENANT_ID)
          .eq("campaign_id", activeCampaign.id)
          .in("player_id", playerIds)
        
        if (existingSpinsInCampaign && existingSpinsInCampaign > 0) {
           console.log("[v0] Bloqueio por dispositivo: Já participou desta campanha", formData.deviceFingerprint)
           return { error: "Este dispositivo já foi usado para participar desta campanha!" }
        }
      }
    }
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      tenant_id: TENANT_ID,
      name: formData.name,
      phone: formData.phone,
      email: null,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_fingerprint: formData.deviceFingerprint || null,
    })
    .select()
    .single()

  if (error) {
    let errorMessage = error.message

    if (error.code === "23505" && error.message.includes("phone")) {
      errorMessage = "Este telefone já está cadastrado! Cada pessoa pode participar apenas uma vez."
    } else if (error.code === "23502") {
      errorMessage = "Por favor, preencha todos os campos obrigatórios."
    } else if (errorMessage.includes("violates")) {
      errorMessage = "Os dados fornecidos violam as regras do sistema."
    }

    console.error("[v0] Erro ao registrar jogador:", error)
    return { error: errorMessage }
  }

  console.log("[v0] Jogador registrado com sucesso:", data?.id)
  return { data }
}

export async function getPrizes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("prizes")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .eq("is_active", true)
    .order("probability", { ascending: false })

  if (error) {
    let errorMessage = "Erro ao carregar os prêmios."

    if (error.message.includes("permission denied")) {
      errorMessage = "Sem permissão para visualizar os prêmios."
    } else if (error.message.includes("not found")) {
      errorMessage = "Nenhum prêmio disponível no momento."
    }

    return { error: errorMessage }
  }

  return { data }
}

export async function recordSpin(playerId: string, prizeId: string, deviceFingerprint?: string) {
  const supabase = await createClient()
  const ipAddress = await getUserIP()
  const userAgent = await getUserAgent()

  console.log("[v0] Registrando giro - Player ID:", playerId, "Prize ID:", prizeId)

  const campaignResult = await getActiveCampaign()
  if (!campaignResult.data) {
    return { error: "Nenhuma campanha ativa no momento." }
  }

  const campaign = campaignResult.data

  // Validar prêmio
  let validPrizeId = prizeId
  if (prizeId === 'dummy' || !prizeId) {
      console.log("[v0] ID de prêmio inválido ('dummy'). Buscando prêmio padrão...")
      const { data: defaultPrize } = await supabase
        .from("prizes")
        .select("id")
        .eq("tenant_id", TENANT_ID)
        .limit(1)
        .maybeSingle()
      
      if (defaultPrize) {
          validPrizeId = defaultPrize.id
          console.log("[v0] Usando prêmio padrão do banco:", validPrizeId)
      } else {
          console.error("[v0] CRÍTICO: Nenhum prêmio encontrado no banco para associar ao giro!")
          // Se não tiver prêmio nenhum, não dá pra salvar na tabela spins se ela exigir prize_id
          // Mas vamos tentar salvar mesmo assim, talvez a coluna aceite null
          // Se a coluna for NOT NULL, isso vai falhar.
      }
  }

  const { data: existingWinner } = await supabase
    .from("campaigns")
    .select("winner_id")
    .eq("tenant_id", TENANT_ID)
    .eq("id", campaign.id)
    .single()

  let isWinner = false

  if (!existingWinner?.winner_id) {
    isWinner = Math.random() < 0.02

    console.log("[v0] Ainda não tem ganhador. Esta pessoa ganhou?", isWinner)
  } else {
    console.log("[v0] Já tem ganhador na campanha. Esta pessoa não pode ganhar.")
  }

  const { data: spinData, error } = await supabase
    .from("spins")
    .insert({
      tenant_id: TENANT_ID,
      player_id: playerId,
      prize_id: validPrizeId,
      campaign_id: campaign.id,
      is_winner: isWinner,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_fingerprint: deviceFingerprint || null,
    })
    .select()
    .single()

  if (error) {
    let errorMessage = "Erro ao registrar o giro."

    if (error.code === "23505" || error.message.includes("duplicate") || error.message.includes("unique")) {
      errorMessage = "Você já girou a roleta nesta campanha!"
    } else if (error.code === "23503") {
      errorMessage = "Jogador ou prêmio inválido."
    } else if (error.message.includes("permission denied")) {
      errorMessage = "Sem permissão para registrar o giro."
    }

    return { error: errorMessage }
  }

  if (isWinner && spinData) {
    console.log("[v0] TEMOS UM GANHADOR! Atualizando campanha...")

    await supabase.from("campaigns").update({ winner_id: spinData.id }).eq("tenant_id", TENANT_ID).eq("id", campaign.id)
  }

  return { data: spinData, isWinner }
}

export async function getSpinHistory(limit = 10, offset = 0) {
  const supabase = await createClient()

  // Agora buscamos da tabela PLAYERS para garantir que todos apareçam,
  // mesmo se o giro falhou em ser salvo.
  const { data, error, count } = await supabase
    .from("players")
    .select(
      `
      id,
      created_at,
      name,
      phone,
      spins (
        id,
        spun_at,
        is_winner,
        prizes (name, description, color, icon)
      )
    `,
      { count: "exact" },
    )
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    let errorMessage = "Erro ao carregar o histórico."
    console.error("Erro getSpinHistory:", error)

    if (error.message.includes("permission denied")) {
      errorMessage = "Sem permissão para visualizar o histórico."
    }

    return { error: errorMessage }
  }

  // Transformar os dados para manter compatibilidade com o frontend
  // O frontend espera uma lista de objetos "spin", então vamos adaptar.
  const formattedData = data.map((player) => {
    // Pega o primeiro giro (se houver)
    const spin = player.spins && player.spins.length > 0 ? player.spins[0] : null
    
    return {
      id: spin?.id || player.id, // Se não tiver ID de giro, usa o do player para chave única
      spun_at: spin?.spun_at || player.created_at, // Se não girou, usa data de cadastro
      is_winner: spin?.is_winner || false,
      players: {
        id: player.id,
        name: player.name,
        phone: player.phone,
      },
      prizes: spin?.prizes || (spin ? null : { name: "Cadastro (Sem Giro)" }), // Indica visualmente
      has_spun: !!spin // Flag útil para saber se girou mesmo
    }
  })

  return { data: formattedData, total: count || 0 }
}

export async function getSpinHistoryOld(limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("spins")
    .select(`
      id,
      spun_at,
      is_winner,
      players (name, email),
      prizes (name, description, color, icon)
    `)
    .eq("tenant_id", TENANT_ID)
    .order("spun_at", { ascending: false })
    .limit(limit)

  if (error) {
    let errorMessage = "Erro ao carregar o histórico."

    if (error.message.includes("permission denied")) {
      errorMessage = "Sem permissão para visualizar o histórico."
    } else if (error.message.includes("not found")) {
      errorMessage = "Nenhum histórico disponível."
    }

    return { error: errorMessage }
  }

  return { data }
}

export async function getActiveCampaign() {
  const supabase = await createClient()

  console.log("[v0] Buscando campanha ativa...")

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)

  console.log("[v0] Resultado da busca:", { data, error })

  if (error) {
    console.log("[v0] Erro ao buscar campanha:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.log("[v0] Nenhuma campanha ativa encontrada")
    return { data: null, error: "Nenhuma campanha ativa" }
  }

  const campaign = data[0]
  console.log("[v0] Campanha encontrada:", campaign)

  if (campaign.ends_at && new Date(campaign.ends_at) < new Date()) {
    console.log("[v0] Campanha expirada")

    await supabase.from("campaigns").update({ is_active: false }).eq("tenant_id", TENANT_ID).eq("id", campaign.id)

    return { data: null, error: "Campanha expirada" }
  }

  console.log("[v0] Campanha ativa válida retornada")
  return { data: campaign }
}

export async function adminLogin(username: string, password: string) {
  console.log("[v0] adminLogin chamado com username:", username)

  if (username === "superadmin" && password === "102030") {
    console.log("[v0] Credenciais corretas")
    return { success: true, token: "authenticated" }
  }

  console.log("[v0] Credenciais inválidas")
  return { error: "Usuário ou senha inválidos" }
}

export async function checkAdminAuth(token?: string) {
  console.log("[v0] checkAdminAuth - token:", token)
  return { isAuthenticated: token === "authenticated" }
}

export async function adminLogout() {
  return { success: true }
}

export async function activateCampaign(token?: string) {
  console.log("[v0] Iniciando ativação de campanha...")

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    console.log("[v0] Não autorizado")
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()

  const { data: existingCampaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .limit(1)

  let campaignId: string

  if (!existingCampaigns || existingCampaigns.length === 0) {
    console.log("[v0] Criando nova campanha...")
    const { data: newCampaign, error: createError } = await supabase
      .from("campaigns")
      .insert({
        tenant_id: TENANT_ID,
        name: "Campanha Roleta Mimo e Cor",
      })
      .select()
      .single()

    if (createError || !newCampaign) {
      console.log("[v0] Erro ao criar campanha:", createError)
      return { error: "Erro ao criar campanha: " + (createError?.message || "Desconhecido") }
    }

    campaignId = newCampaign.id
  } else {
    campaignId = existingCampaigns[0].id
  }

  console.log("[v0] Ativando campanha ID:", campaignId)

  const now = new Date()
  const endsAt = new Date(now.getTime() + 60 * 60 * 1000) // +1 hora

  const { error: updateError } = await supabase
    .from("campaigns")
    .update({
      is_active: true,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      winner_id: null,
    })
    .eq("tenant_id", TENANT_ID)
    .eq("id", campaignId)

  if (updateError) {
    console.log("[v0] Erro ao ativar campanha:", updateError)
    return { error: "Erro ao ativar campanha: " + updateError.message }
  }

  const { data: updatedCampaign, error: selectError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .eq("id", campaignId)
    .single()

  if (selectError) {
    console.log("[v0] Erro ao buscar campanha atualizada:", selectError)
    return { success: true, message: "Campanha ativada (dados não puderam ser recuperados)" }
  }

  console.log("[v0] Campanha ativada com sucesso:", updatedCampaign)
  return { data: updatedCampaign, success: true }
}

export async function deactivateCampaign(token?: string) {
  console.log("[v0] Iniciando desativação de campanha...")

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    console.log("[v0] Não autorizado")
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()

  const { data: activeCampaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)

  if (!activeCampaigns || activeCampaigns.length === 0) {
    console.log("[v0] Nenhuma campanha ativa encontrada")
    return { error: "Nenhuma campanha ativa para desativar" }
  }

  const activeCampaign = activeCampaigns[0]
  console.log("[v0] Desativando campanha ID:", activeCampaign.id)

  const { error: updateError } = await supabase
    .from("campaigns")
    .update({ is_active: false })
    .eq("tenant_id", TENANT_ID)
    .eq("id", activeCampaign.id)

  if (updateError) {
    console.log("[v0] Erro ao desativar:", updateError)
    return { error: "Erro ao desativar campanha: " + updateError.message }
  }

  const { data: updatedCampaign, error: selectError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .eq("id", activeCampaign.id)
    .single()

  if (selectError) {
    console.log("[v0] Erro ao buscar dados atualizados, mas campanha foi desativada")
    return { success: true, message: "Campanha desativada com sucesso" }
  }

  console.log("[v0] Campanha desativada com sucesso:", updatedCampaign)
  return { data: updatedCampaign, success: true }
}

export async function getAllWinners() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(
      `
      id,
      name,
      started_at,
      ends_at,
      is_active
    `,
    )
    .eq("tenant_id", TENANT_ID)
    .order("started_at", { ascending: false })

  if (!campaigns) return []

  const winnersData = await Promise.all(
    campaigns.map(async (campaign) => {
      const { data: winner } = await supabase
        .from("spins")
        .select(
          `
          *,
          players (name, phone),
          prizes (name)
        `,
        )
        .eq("tenant_id", TENANT_ID)
        .eq("campaign_id", campaign.id)
        .eq("is_winner", true)
        .maybeSingle()

      const { count: totalParticipants } = await supabase
        .from("spins")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", TENANT_ID)
        .eq("campaign_id", campaign.id)

      return {
        campaign,
        winner,
        totalParticipants: totalParticipants || 0,
      }
    }),
  )

  return winnersData.filter((data) => data.winner !== null)
}

export async function getCampaignStats() {
  const supabase = await createClient()

  // Buscar última campanha (ativa ou não)
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false }) // Alterado de started_at para created_at para pegar a mais recente mesmo se não iniciada
    .limit(1)

  const campaign = campaigns && campaigns.length > 0 ? campaigns[0] : null
  let winner = null

  if (campaign) {
    const { data: w } = await supabase
      .from("spins")
      .select(
        `
        *,
        players (name, phone),
        prizes (name)
      `,
      )
      .eq("tenant_id", TENANT_ID)
      .eq("campaign_id", campaign.id)
      .eq("is_winner", true)
      .maybeSingle()

    if (w) {
      winner = w
    }
  }

  let totalSpins = 0

  if (campaign?.id) {
    const { count } = await supabase
      .from("spins")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", TENANT_ID)
      .eq("campaign_id", campaign.id)

    totalSpins = count || 0
  }

  return {
    campaign,
    totalSpins,
    winner,
  }
}

export async function drawWinner(campaignId: string, token?: string) {
  console.log("[v0] Verificando se já existe ganhador automático...")

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    console.log("[v0] Não autorizado")
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(`
      *,
      spins!campaigns_winner_id_fkey (
        id,
        players (name, phone)
      )
    `)
    .eq("tenant_id", TENANT_ID)
    .eq("id", campaignId)
    .single()

  if (!campaign) {
    return { error: "Campanha não encontrada" }
  }

  if (campaign.winner_id) {
    return {
      success: true,
      alreadyWon: true,
      winner: {
        name: campaign.spins?.players?.name,
        phone: campaign.spins?.players?.phone,
        spinId: campaign.winner_id,
      },
    }
  }

  const { data: allSpins } = await supabase
    .from("spins")
    .select(`
      *,
      players (name, phone)
    `)
    .eq("tenant_id", TENANT_ID)
    .eq("campaign_id", campaignId)

  if (!allSpins || allSpins.length === 0) {
    return { error: "Nenhum participante nesta campanha" }
  }

  console.log("[v0] Nenhum ganhador automático. Sorteando entre", allSpins.length, "participantes")

  const randomIndex = Math.floor(Math.random() * allSpins.length)
  const winnerSpin = allSpins[randomIndex]

  console.log("[v0] Ganhador sorteado manualmente:", winnerSpin)

  await supabase.from("spins").update({ is_winner: true }).eq("tenant_id", TENANT_ID).eq("id", winnerSpin.id)

  await supabase
    .from("campaigns")
    .update({
      winner_id: winnerSpin.id,
      is_active: false,
    })
    .eq("tenant_id", TENANT_ID)
    .eq("id", campaignId)

  return {
    success: true,
    winner: {
      name: winnerSpin.players?.name,
      phone: winnerSpin.players?.phone,
      spinId: winnerSpin.id,
    },
  }
}

export async function clearParticipants(token?: string) {
  console.log("[v0] Iniciando limpeza de participantes...")

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    console.log("[v0] Não autorizado")
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()

  const { error: deleteSpinsError } = await supabase
    .from("spins")
    .delete()
    .eq("tenant_id", TENANT_ID)
    .neq("id", "00000000-0000-0000-0000-000000000000")

  if (deleteSpinsError) {
    console.log("[v0] Erro ao deletar spins:", deleteSpinsError)
    return { error: "Erro ao limpar giros: " + deleteSpinsError.message }
  }

  const { error: deletePlayersError } = await supabase
    .from("players")
    .delete()
    .eq("tenant_id", TENANT_ID)
    .neq("id", "00000000-0000-0000-0000-000000000000")

  if (deletePlayersError) {
    console.log("[v0] Erro ao deletar jogadores:", deletePlayersError)
    return { error: "Erro ao limpar jogadores: " + deletePlayersError.message }
  }

  await supabase.from("campaigns").update({ winner_id: null }).eq("tenant_id", TENANT_ID).eq("is_active", true)

  console.log("[v0] Banco de dados limpo com sucesso!")
  return { success: true, message: "Todos os participantes foram removidos com sucesso!" }
}

export async function exportParticipantsCSV(campaignId?: string, token?: string) {
  console.log("[v0] Exportando participantes para CSV...")

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    console.log("[v0] Não autorizado")
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()

  // Se campaignId não for fornecido, pegar a campanha mais recente
  let targetCampaignId = campaignId

  if (!targetCampaignId) {
    const { data: latestCampaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!latestCampaign) {
      return { error: "Nenhuma campanha encontrada" }
    }

    targetCampaignId = latestCampaign.id
  }

  // Buscar todos os participantes da campanha
  const { data: spins, error } = await supabase
    .from("spins")
    .select(
      `
      spun_at,
      is_winner,
      players (
        name,
        phone
      )
    `,
    )
    .eq("tenant_id", TENANT_ID)
    .eq("campaign_id", targetCampaignId)
    .order("spun_at", { ascending: false })

  if (error) {
    console.log("[v0] Erro ao buscar participantes:", error)
    return { error: "Erro ao buscar participantes: " + error.message }
  }

  if (!spins || spins.length === 0) {
    return { error: "Nenhum participante nesta campanha" }
  }

  // Criar CSV com BOM para compatibilidade com Excel
  const csvHeader = "\uFEFFNome,Telefone,Data/Hora,Ganhou\n"
  const csvRows = spins
    .map((spin: any) => {
      const name = spin.players?.name || "N/A"
      const phone = spin.players?.phone || "N/A"
      const date = new Date(spin.spun_at).toLocaleString("pt-BR")
      const won = spin.is_winner ? "Sim" : "Não"

      return `"${name}","${phone}","${date}","${won}"`
    })
    .join("\n")

  const csvContent = csvHeader + csvRows

  console.log("[v0] CSV gerado com", spins.length, "participantes")

  return {
    success: true,
    csv: csvContent,
    totalParticipants: spins.length,
  }
}

export async function deactivateCampaignWithCleanup(shouldClearParticipants = false, token?: string) {
  console.log("[v0] Iniciando desativação de campanha com cleanup:", shouldClearParticipants)

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    console.log("[v0] Não autorizado")
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()

  const { data: activeCampaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)

  if (!activeCampaigns || activeCampaigns.length === 0) {
    console.log("[v0] Nenhuma campanha ativa encontrada")
    return { error: "Nenhuma campanha ativa para desativar" }
  }

  const activeCampaign = activeCampaigns[0]
  console.log("[v0] Desativando campanha ID:", activeCampaign.id)

  // Desativar campanha
  const { error: updateError } = await supabase
    .from("campaigns")
    .update({ is_active: false })
    .eq("tenant_id", TENANT_ID)
    .eq("id", activeCampaign.id)

  if (updateError) {
    console.log("[v0] Erro ao desativar:", updateError)
    return { error: "Erro ao desativar campanha: " + updateError.message }
  }

  // Se deve limpar participantes, fazer a limpeza
  if (shouldClearParticipants) {
    console.log("[v0] Limpando participantes após desativação...")
    const clearResult = await clearParticipants(token)

    if (clearResult.error) {
      return {
        success: true,
        message: "Campanha desativada, mas houve erro ao limpar participantes: " + clearResult.error,
      }
    }

    return {
      success: true,
      message: "Campanha desativada e participantes limpos com sucesso!",
      cleared: true,
    }
  }

  const { data: updatedCampaign, error: selectError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .eq("id", activeCampaign.id)
    .single()

  if (selectError) {
    console.log("[v0] Erro ao buscar dados atualizados, mas campanha foi desativada")
    return { success: true, message: "Campanha desativada com sucesso" }
  }

  console.log("[v0] Campanha desativada com sucesso:", updatedCampaign)
  return { data: updatedCampaign, success: true }
}

export async function deleteParticipant(playerId: string, token?: string) {
  console.log("[v0] Deletando participante:", playerId)

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    console.log("[v0] Não autorizado")
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()

  // Deletar os spins do participante primeiro
  const { error: deleteSpinsError } = await supabase
    .from("spins")
    .delete()
    .eq("player_id", playerId)
    .eq("tenant_id", TENANT_ID)

  if (deleteSpinsError) {
    console.log("[v0] Erro ao deletar spins:", deleteSpinsError)
    return { error: "Erro ao deletar giros: " + deleteSpinsError.message }
  }

  // Deletar o participante
  const { error: deletePlayerError } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId)
    .eq("tenant_id", TENANT_ID)

  if (deletePlayerError) {
    console.log("[v0] Erro ao deletar participante:", deletePlayerError)
    return { error: "Erro ao deletar participante: " + deletePlayerError.message }
  }

  console.log("[v0] Participante deletado com sucesso!")
  return { success: true, message: "Participante removido com sucesso!" }
}
