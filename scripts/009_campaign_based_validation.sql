-- Adicionar coluna campaign_id na tabela spins para rastreamento preciso
ALTER TABLE public.spins ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);

-- Criar índice para buscas eficientes
CREATE INDEX IF NOT EXISTS idx_spins_campaign_device ON public.spins(campaign_id, device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_spins_campaign_ip ON public.spins(campaign_id, ip_address);

-- Comentário explicativo
COMMENT ON COLUMN spins.campaign_id IS 
'ID da campanha para permitir mesma pessoa participar de campanhas diferentes';
