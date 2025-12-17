-- Corrigir constraint para permitir mesmo player em campanhas diferentes
-- mas não permitir giro duplicado na mesma campanha

-- Adicionar IF EXISTS para evitar erro se constraint já existir
-- Remover constraint antigo (global)
ALTER TABLE spins DROP CONSTRAINT IF EXISTS unique_player_spin;

-- Remover o novo constraint se já existir (para recriar)
ALTER TABLE spins DROP CONSTRAINT IF EXISTS unique_player_per_campaign;

-- Criar constraint correto: player único POR CAMPANHA
ALTER TABLE spins ADD CONSTRAINT unique_player_per_campaign 
  UNIQUE (campaign_id, player_id);

-- Verificar o constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'unique_player_per_campaign';
