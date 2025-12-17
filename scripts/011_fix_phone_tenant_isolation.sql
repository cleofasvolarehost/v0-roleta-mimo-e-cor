-- Correção do Isolamento por Tenant no Campo Telefone
-- Data: 2025-01-17
-- Problema: O telefone tinha constraint único GLOBAL, impedindo o mesmo número em tenants diferentes
-- Solução: Constraint único por TENANT, permitindo o mesmo telefone em Mimo e Cor vs Wordnet

-- Remover constraint único global do telefone
DROP INDEX IF EXISTS players_phone_key;

-- Criar constraint único POR TENANT
-- Isso permite que o mesmo telefone exista em tenants diferentes (Mimo e Cor vs Wordnet)
-- Mas dentro do mesmo tenant, o telefone permanece único
CREATE UNIQUE INDEX IF NOT EXISTS players_phone_tenant_key 
  ON players(tenant_id, phone) 
  WHERE phone IS NOT NULL;

-- Verificar se o constraint foi criado corretamente
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'players' 
  AND indexname = 'players_phone_tenant_key';
