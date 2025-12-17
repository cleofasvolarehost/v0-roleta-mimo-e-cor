-- Adicionar colunas para proteção multi-fator
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

ALTER TABLE public.spins ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.spins ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Criar índices compostos para busca eficiente
CREATE INDEX IF NOT EXISTS idx_players_multi_factor ON public.players(ip_address, user_agent);
CREATE INDEX IF NOT EXISTS idx_spins_multi_factor ON public.spins(ip_address, user_agent);
CREATE INDEX IF NOT EXISTS idx_spins_device_fingerprint ON public.spins(device_fingerprint);

-- Criar constraint única para device fingerprint por campanha
-- (Controlado no código para maior flexibilidade)

COMMENT ON COLUMN spins.device_fingerprint IS 
'Identificador único do dispositivo baseado em múltiplos fatores do navegador';

COMMENT ON COLUMN spins.user_agent IS 
'User agent do navegador para identificação combinada com IP';
