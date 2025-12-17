-- Adicionar campo de telefone na tabela players
ALTER TABLE players ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Corrigido: Constraint único POR TENANT em vez de global
-- Isso permite que o mesmo telefone exista em projetos diferentes (Mimo e Cor vs Wordnet)
CREATE UNIQUE INDEX IF NOT EXISTS players_phone_tenant_key 
  ON players(tenant_id, phone) 
  WHERE phone IS NOT NULL;

-- Atualizar constraint para permitir telefone
COMMENT ON COLUMN players.phone IS 'Telefone do jogador para contato e identificação única por tenant';
