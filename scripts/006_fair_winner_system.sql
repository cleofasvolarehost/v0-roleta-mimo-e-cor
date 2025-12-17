-- Adicionar coluna de IP para prevenir múltiplos giros
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.spins ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Criar índice para busca rápida por IP
CREATE INDEX IF NOT EXISTS idx_players_ip ON public.players(ip_address);
CREATE INDEX IF NOT EXISTS idx_spins_ip ON public.spins(ip_address);

-- Adicionar constraint para um spin por IP durante uma campanha
-- (Vamos controlar isso no código da aplicação)

-- Criar função para verificar se já existe ganhador
CREATE OR REPLACE FUNCTION has_winner_in_campaign(campaign_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM campaigns 
    WHERE id = campaign_id_param 
    AND winner_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Comentário explicativo do sistema
COMMENT ON FUNCTION has_winner_in_campaign IS 
'Verifica se uma campanha já tem um ganhador definido. 
Usado para garantir que apenas uma pessoa ganha por campanha.';
