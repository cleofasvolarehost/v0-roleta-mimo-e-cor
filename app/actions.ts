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

      /* 
      // DESATIVADO: Fingerprint gera falsos positivos em celulares iguais/mesma rede.
      // Vamos confiar apenas no telefone para não bloquear clientes reais.
      
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
      */
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
      let { data: defaultPrize } = await supabase
        .from("prizes")
        .select("id")
        .eq("tenant_id", TENANT_ID)
        .limit(1)
        .maybeSingle()
      
      if (!defaultPrize) {
          console.log("[v0] Nenhum prêmio encontrado. Criando prêmio de fallback...")
          // Criar um prêmio de fallback para não travar o sistema
          const { data: newPrize, error: createPrizeError } = await supabase
            .from("prizes")
            .insert({
                tenant_id: TENANT_ID,
                name: "Participação",
                probability: 0,
                is_active: true,
                color: "#cccccc"
            })
            .select("id")
            .single()
            
          if (newPrize) {
              defaultPrize = newPrize
          } else {
              console.error("[v0] Falha ao criar prêmio de fallback:", createPrizeError)
          }
      }

      if (defaultPrize) {
          validPrizeId = defaultPrize.id
          console.log("[v0] Usando prêmio do banco:", validPrizeId)
      } else {
          console.error("[v0] CRÍTICO: Impossível obter um ID de prêmio válido.")
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
    // ALTERAÇÃO: Removida a chance de 2% (Math.random() < 0.02).
    // Agora NINGUÉM ganha no giro. O ganhador será definido EXCLUSIVAMENTE pelo sorteio manual no admin.
    isWinner = false 

    console.log("[v0] Modo Sorteio Manual Ativo: Ninguém ganha instantaneamente no giro.")
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

    console.error("[v0] Erro DETALHADO ao inserir spin:", JSON.stringify(error, null, 2))

    if (error.code === "23505" || error.message.includes("duplicate") || error.message.includes("unique")) {
      errorMessage = "Você já girou a roleta nesta campanha!"
    } else if (error.code === "23503") {
      errorMessage = "Jogador ou prêmio inválido."
    } else if (error.message.includes("permission denied")) {
      errorMessage = "Sem permissão para registrar o giro."
    } else {
      // Temporário: mostrar erro técnico para debug
      errorMessage = `Erro técnico: ${error.message} (Código: ${error.code})`
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

  // 1. Buscar a campanha mais recente para filtrar a lista
  // Assim, mostramos apenas os participantes da campanha atual/última
  const { data: latestCampaign } = await supabase
    .from("campaigns")
    .select("started_at, is_active, winner_id")
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Se a campanha estiver INATIVA e NÃO TIVER GANHADOR, retorna lista vazia
  // Isso atende à solicitação de "limpar a tela" ao desativar.
  if (latestCampaign && !latestCampaign.is_active && !latestCampaign.winner_id) {
    return { data: [], total: 0 }
  }

  // Agora buscamos da tabela PLAYERS
  let query = supabase
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
      { count: "exact" }
    )
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  // APLICAR FILTRO: Mostrar apenas participantes desta campanha
  if (latestCampaign?.started_at) {
      query = query.gte("created_at", latestCampaign.started_at)
  }

  const { data, error, count } = await query

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

export async function getPastWinners(limit = 10, offset = 0) {
  const supabase = await createClient()

  // 1. Buscar campanhas encerradas com ganhador
  const { data: campaigns, error: campaignsError, count } = await supabase
    .from("campaigns")
    .select("id, name, started_at, ends_at, winner_id", { count: "exact" })
    .eq("tenant_id", TENANT_ID)
    .not("winner_id", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (campaignsError) {
    console.error("Erro getPastWinners (campaigns):", campaignsError)
    return { error: "Erro ao carregar campanhas anteriores." }
  }

  if (!campaigns || campaigns.length === 0) {
    return { data: [], total: count || 0 }
  }

  // 2. Buscar detalhes dos spins vencedores
  const winnerIds = campaigns.map(c => c.winner_id)
  
  const { data: spins, error: spinsError } = await supabase
    .from("spins")
    .select(`
      id,
      spun_at,
      players (name, phone),
      prizes (name, description, color)
    `)
    .eq("tenant_id", TENANT_ID)
    .in("id", winnerIds)

  if (spinsError) {
    console.error("Erro getPastWinners (spins):", spinsError)
    // Se falhar ao buscar detalhes, retornamos lista vazia ou erro parcial?
    // Melhor retornar erro para não mostrar dados quebrados
    return { error: "Erro ao carregar detalhes dos ganhadores." }
  }

  // 3. Combinar os dados
  const spinsMap = new Map(spins?.map(s => [s.id, s]))

  const formattedData = campaigns.map(campaign => {
    const spin = spinsMap.get(campaign.winner_id)
    
    return {
      id: campaign.id,
      campaignName: campaign.name,
      date: campaign.started_at || campaign.ends_at,
      winner: {
        name: spin?.players?.name || "Desconhecido",
        phone: spin?.players?.phone || "...",
        prize: spin?.prizes?.name || "R$ 50 Vale Compra"
      }
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

  console.log("[v0] Criando NOVA campanha para garantir lista limpa...")
  
  const now = new Date()
  const endsAt = new Date(now.getTime() + 60 * 60 * 1000) // +1 hora

  // SEMPRE criar uma nova campanha ao ativar
  // Isso garante que o timestamp 'started_at' seja novo e limpe a lista de participantes visualizada
  const { data: newCampaign, error: createError } = await supabase
    .from("campaigns")
    .insert({
      tenant_id: TENANT_ID,
      name: `Campanha ${now.toLocaleString("pt-BR")}`,
      is_active: true,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      winner_id: null,
    })
    .select()
    .single()

  if (createError || !newCampaign) {
    console.log("[v0] Erro ao criar nova campanha:", createError)
    return { error: "Erro ao criar campanha: " + (createError?.message || "Desconhecido") }
  }

  console.log("[v0] Nova campanha ativada com sucesso:", newCampaign)
  return { data: newCampaign, success: true }
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

      // Buscar o total de participantes REAIS no banco de dados para exibir corretamente
      // (Isso corrige o problema de exibir apenas 2 pessoas quando foram 17 restaurados)
      const { count: totalParticipants } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", TENANT_ID)
        // REMOVIDO FILTRO DE DATA: Conta todos os participantes do banco para evitar confusão
        // .gte("created_at", campaign.started_at || "2024-01-01") 

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
    // Se a campanha estiver INATIVA e NÃO TIVER GANHADOR, retorna ZEROS
    if (!campaign.is_active && !winner) {
         return {
            campaign,
            totalSpins: 0,
            winner: null
         }
    }

    // Tentar contar TOTAL DE PARTICIPANTES (Players) em vez de apenas spins
    // Para incluir quem se cadastrou mas falhou no giro.
    // Usamos created_at >= campaign.started_at como filtro aproximado
    
    let playerCount = 0;
    
    if (campaign.started_at) {
        const { count: pCount } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", TENANT_ID)
        .gte("created_at", campaign.started_at)
        
        playerCount = pCount || 0
    }
    
    // Se por algum motivo o count de players for menor que spins (improvável), usamos spins
    // Ou se não tiver started_at, usamos spins.
    
    const { count: sCount } = await supabase
      .from("spins")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", TENANT_ID)
      .eq("campaign_id", campaign.id)

    totalSpins = Math.max(playerCount, sCount || 0)
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
    // Tentar buscar a última campanha ativa ou criada como fallback
    const { data: latestCampaign } = await supabase
        .from("campaigns")
        .select(`
          *,
          spins!campaigns_winner_id_fkey (
            id,
            players (name, phone)
          )
        `)
        .eq("tenant_id", TENANT_ID)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!latestCampaign) {
        return { error: "Campanha não encontrada e nenhuma recente disponível." }
    }
    
    // Usar a campanha encontrada
    // (Gambiarra segura: reatribuir a variavel campaign não é possivel pq é const, 
    // então vamos prosseguir com a logica usando latestCampaign se campaign for null)
    // Mas como campaign é const, vou ter que refatorar um pouco.
    return drawWinner(latestCampaign.id, token) // Chamada recursiva com o ID certo
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

  // Buscar TODOS os participantes elegíveis (Players)
  // Usamos created_at >= campaign.started_at para pegar quem se cadastrou nesta campanha
  // Isso inclui quem girou e quem falhou no giro (fantasmas)
  
  let eligiblePlayers = []
  
  if (campaign.started_at) {
      const { data: players } = await supabase
        .from("players")
        .select("id, name, phone")
        .eq("tenant_id", TENANT_ID)
        .gte("created_at", campaign.started_at)
        
      if (players) eligiblePlayers = players
  } else {
      // Fallback se não tiver data de inicio (improvavel)
      const { data: spins } = await supabase
        .from("spins")
        .select("player_id")
        .eq("tenant_id", TENANT_ID)
        .eq("campaign_id", campaignId)
        
      if (spins) {
          const playerIds = spins.map(s => s.player_id)
          const { data: players } = await supabase
            .from("players")
            .select("id, name, phone")
            .eq("tenant_id", TENANT_ID)
            .in("id", playerIds)
            
          if (players) eligiblePlayers = players
      }
  }

  if (eligiblePlayers.length === 0) {
    console.log("[v0] Nenhum jogador encontrado pela data. Tentando buscar os últimos cadastrados (fallback)...")
    
    // Fallback: Buscar os últimos 50 jogadores cadastrados que não ganharam ainda
    const { data: recentPlayers } = await supabase
        .from("players")
        .select("id, name, phone")
        .eq("tenant_id", TENANT_ID)
        .order("created_at", { ascending: false })
        .limit(50)
        
    if (recentPlayers && recentPlayers.length > 0) {
        eligiblePlayers = recentPlayers
        console.log("[v0] Fallback: Encontrados", eligiblePlayers.length, "jogadores recentes.")
    } else {
        return { error: "Nenhum participante elegível nesta campanha (nem recentes)" }
    }
  }

  console.log("[v0] Sorteando entre", eligiblePlayers.length, "jogadores elegíveis")

  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length)
  const winnerPlayer = eligiblePlayers[randomIndex]

  console.log("[v0] Jogador sorteado:", winnerPlayer.name, winnerPlayer.id)
  
  // Verificar se o ganhador já tem um spin
  let { data: winnerSpin } = await supabase
    .from("spins")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .eq("player_id", winnerPlayer.id)
    .eq("campaign_id", campaignId)
    .limit(1)
    .maybeSingle()
    
  if (!winnerSpin) {
      console.log("[v0] Ganhador não tinha spin (fantasma). Criando spin vencedor...")
      
      // Buscar prêmio padrão
      const { data: defaultPrize } = await supabase
        .from("prizes")
        .select("id")
        .eq("tenant_id", TENANT_ID)
        .limit(1)
        .maybeSingle()
        
      // Criar spin vencedor
      const { data: newSpin, error: createSpinError } = await supabase
        .from("spins")
        .insert({
          tenant_id: TENANT_ID,
          player_id: winnerPlayer.id,
          prize_id: defaultPrize?.id, // Pode ser null se não tiver prêmio, mas vamos tentar
          campaign_id: campaignId,
          is_winner: true,
          ip_address: "system_draw",
          user_agent: "system_draw"
        })
        .select()
        .single()
        
      if (createSpinError || !newSpin) {
          console.error("[v0] Erro ao criar spin para ganhador:", createSpinError)
          return { error: "Erro técnico ao registrar ganhador" }
      }
      
      winnerSpin = newSpin
  } else {
      // Atualizar spin existente
      await supabase.from("spins").update({ is_winner: true }).eq("tenant_id", TENANT_ID).eq("id", winnerSpin.id)
  }

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
      name: winnerPlayer.name,
      phone: winnerPlayer.phone,
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

  const { error: updateCampaignsError } = await supabase
    .from("campaigns")
    .update({ winner_id: null })
    .eq("tenant_id", TENANT_ID)

  if (updateCampaignsError) {
     console.log("[v0] Erro ao desvincular ganhadores:", updateCampaignsError)
  }

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

  // Opcional: Deletar campanhas de teste antigas? 
  // Por enquanto, apenas garantimos que nenhuma tenha ganhador e todas estejam inativas
  await supabase.from("campaigns").update({ is_active: false }).eq("tenant_id", TENANT_ID)

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

export async function generateTestParticipants(token?: string) {
  console.log("[v0] Gerando participantes de teste...")

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()
  const ipAddress = "127.0.0.1"
  const userAgent = "Test Generator"

  const testNames = [
    "Ana Silva", "Carlos Oliveira", "Mariana Santos", "João Souza", 
    "Fernanda Lima", "Pedro Rocha", "Beatriz Costa", "Lucas Pereira", 
    "Juliana Martins", "Rafael Alves"
  ]

  let createdCount = 0

  for (const name of testNames) {
    const randomPhone = `(11) 9${Math.floor(Math.random() * 90000000 + 10000000)}`
    
    // Tenta criar player
    const { error } = await supabase
      .from("players")
      .insert({
        tenant_id: TENANT_ID,
        name: name,
        phone: randomPhone,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
    
    if (!error) createdCount++
  }

  // Garantir que temos uma campanha ativa para associar, se não criar spin
  // Na verdade, para o sorteio funcionar com a nova lógica, BASTA ter o player criado!
  // A lógica nova busca players criados >= campaign.started_at.
  // Então precisamos garantir que os players tenham created_at RECENTE (o que já vai ter).

  return { success: true, message: `${createdCount} participantes de teste gerados com sucesso!` }
}

export async function restoreParticipantsFromCSV(csvContent: string, token?: string) {
  console.log("[v0] Restaurando participantes do CSV...")

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()
  const ipAddress = "127.0.0.1" // Restaurado
  const userAgent = "CSV Restore"

  // Processar o CSV
  // Formato esperado: "Nome","Telefone","Data/Hora","Ganhou"
  const lines = csvContent.split('\n')
  let restoredCount = 0
  let errorCount = 0

  for (const line of lines) {
    // Ignorar cabeçalho ou linhas vazias
    if (!line.trim() || line.includes("Nome,Telefone")) continue

    // Regex para pegar conteúdo entre aspas
    const matches = line.match(/"([^"]*)"/g)
    if (!matches || matches.length < 2) continue

    const name = matches[0].replace(/"/g, '').trim()
    // Limpar telefone mantendo apenas números, mas se tiver DDD, ok.
    // O banco espera string, então vamos limpar formatação visual apenas se necessário
    let phone = matches[1].replace(/"/g, '').trim()
    
    // Opcional: remover caracteres não numéricos se o seu banco exige apenas números
    // phone = phone.replace(/\D/g, '') 
    
    // Tenta criar player
    const { error } = await supabase
      .from("players")
      .insert({
        tenant_id: TENANT_ID,
        name: name,
        phone: phone,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
    
    if (!error) {
        restoredCount++
    } else {
        // Se der erro (ex: duplicado), ignoramos e seguimos
        console.log(`Erro ao restaurar ${name}:`, error.message)
        errorCount++
    }
  }

  return {
    success: true,
    message: `${restoredCount} participantes restaurados com sucesso! (${errorCount} falhas/duplicados)` 
  }
}

export async function emergencyDrawWinner(token?: string) {
  console.log("[v0] MODO SORTEIO DE EMERGÊNCIA ATIVADO (V2)")

  const authCheck = await checkAdminAuth(token)
  if (!authCheck.isAuthenticated) {
    return { error: "Não autorizado" }
  }

  const supabase = await createClient()

  // 1. Buscar participantes
  // Buscar última campanha para pegar data de corte
  const { data: latestCampaign } = await supabase
    .from("campaigns")
    .select("started_at")
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let query = supabase
      .from("players")
      .select("id, name, phone")
      .eq("tenant_id", TENANT_ID)
      .order("created_at", { ascending: false })
      .limit(1000)

  if (latestCampaign?.started_at) {
      console.log("[v0] Filtrando participantes após:", latestCampaign.started_at)
      query = query.gte("created_at", latestCampaign.started_at)
  }

  const { data: eligiblePlayers } = await query

  if (!eligiblePlayers || eligiblePlayers.length === 0) {
      return { error: "Nenhum participante elegível encontrado para esta campanha!" }
  }

  console.log(`[v0] Sorteando entre ${eligiblePlayers.length} participantes encontrados.`)

  // 2. Realizar o Sorteio
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length)
  const winnerPlayer = eligiblePlayers[randomIndex]
  console.log("[v0] Ganhador Sorteado:", winnerPlayer.name)

  // 3. Buscar ou Criar Campanha para registrar o prêmio
  let { data: campaign } = await supabase
    .from("campaigns")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let campaignId = campaign?.id

  if (!campaignId) {
      console.log("[v0] Nenhuma campanha encontrada. Criando campanha de emergência...")
      const { data: newCampaign, error: createError } = await supabase
          .from("campaigns")
          .insert({
              tenant_id: TENANT_ID,
              name: "Sorteio de Emergência",
              is_active: false,
              started_at: new Date().toISOString(),
              ends_at: new Date().toISOString()
          })
          .select()
          .single()
      
      if (createError || !newCampaign) {
          console.error("Erro fatal ao criar campanha:", createError)
          return { error: "Erro crítico: Não foi possível registrar o sorteio." }
      }
      campaignId = newCampaign.id
  }

  // 4. Registrar o Spin Vencedor
  // Primeiro verifica se o ganhador já tem spin nessa campanha
  let { data: winnerSpin } = await supabase
    .from("spins")
    .select("id")
    .eq("tenant_id", TENANT_ID)
    .eq("player_id", winnerPlayer.id)
    .eq("campaign_id", campaignId)
    .maybeSingle()

  if (!winnerSpin) {
      // Criar spin vencedor
      const { data: newSpin } = await supabase
        .from("spins")
        .insert({
          tenant_id: TENANT_ID,
          player_id: winnerPlayer.id,
          campaign_id: campaignId,
          is_winner: true,
          prize_id: null, // Pode ser null
          ip_address: "manual_draw",
          user_agent: "manual_draw"
        })
        .select()
        .single()
      winnerSpin = newSpin
  } else {
      // Atualizar spin existente
      await supabase
        .from("spins")
        .update({ is_winner: true })
        .eq("id", winnerSpin.id)
  }

  // 5. Atualizar Campanha com o Ganhador
  await supabase
    .from("campaigns")
    .update({
      winner_id: winnerSpin?.id,
      is_active: false, // Encerra a campanha
    })
    .eq("id", campaignId)

  return {
    success: true,
    winner: {
      name: winnerPlayer.name,
      phone: winnerPlayer.phone,
      spinId: winnerSpin?.id,
    },
  }
}

export async function getCampaignStatsV2() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .limit(1)

  let campaign = campaigns && campaigns.length > 0 ? campaigns[0] : null
  
  // Auto-expire logic: Se estiver ativa mas o tempo acabou, desativar no banco
  if (campaign && campaign.is_active && campaign.ends_at && new Date(campaign.ends_at) < new Date()) {
      console.log("[v0] getCampaignStatsV2 detectou campanha expirada. Desativando...")
      await supabase.from("campaigns").update({ is_active: false }).eq("tenant_id", TENANT_ID).eq("id", campaign.id)
      campaign.is_active = false
  }

  let winner = null

  // If no campaign, return null
  if (!campaign) {
     return {
        campaign: null,
        totalSpins: 0,
        winner: null
     }
  }

  // If we have a winner_id, fetch winner details
  if (campaign.winner_id) {
    const { data: w } = await supabase
      .from("spins")
      .select(`*, players (name, phone), prizes (name)`)
      .eq("tenant_id", TENANT_ID)
      .eq("id", campaign.winner_id)
      .maybeSingle()

    if (w) winner = w
  }

  // Count participants
  let totalSpins = 0
  
  // FIX: Contar participantes SEMPRE que houver data de início, 
  // independente se a campanha está ativa ou não.
  // Isso permite realizar o sorteio APÓS o término da campanha.
  if (campaign.started_at) {
        const { count: pCount } = await supabase
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", TENANT_ID)
        .gte("created_at", campaign.started_at)
        
        totalSpins = pCount || 0
  }

  return { campaign, totalSpins, winner }
}

export async function getSpinHistoryV2(limit = 10, offset = 0) {
  const supabase = await createClient()

  const { data: latestCampaign } = await supabase
    .from("campaigns")
    .select("started_at, is_active, winner_id")
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // FIX: Se a campanha estiver INATIVA, retorna lista vazia SEMPRE.
  // Mesmo se tiver ganhador, não mostramos a lista de participantes na home do admin
  // para evitar confusão. O ganhador continua aparecendo no card de destaque.
  if (!latestCampaign || latestCampaign.is_active === false) {
    return { data: [], total: 0 }
  }

  let query = supabase
    .from("players")
    .select(`
      id, created_at, name, phone,
      spins (id, spun_at, is_winner, prizes (name))
    `, { count: "exact" })
    .eq("tenant_id", TENANT_ID)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (latestCampaign.started_at) {
      query = query.gte("created_at", latestCampaign.started_at)
  }

  const { data, error, count } = await query

  if (error) return { error: "Erro ao carregar histórico" }

  const formattedData = data.map((player) => {
    const spin = player.spins && player.spins.length > 0 ? player.spins[0] : null
    return {
      id: spin?.id || player.id,
      spun_at: spin?.spun_at || player.created_at,
      is_winner: spin?.is_winner || false,
      players: { id: player.id, name: player.name, phone: player.phone },
      prizes: spin?.prizes || (spin ? null : { name: "Cadastro (Sem Giro)" }),
      has_spun: !!spin
    }
  })

  return { data: formattedData, total: count || 0 }
}
