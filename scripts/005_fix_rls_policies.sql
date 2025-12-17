-- Garantir que as políticas RLS permitam operações na tabela campaigns

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura de campanhas" ON campaigns;
DROP POLICY IF EXISTS "Permitir inserção de campanhas" ON campaigns;
DROP POLICY IF EXISTS "Permitir atualização de campanhas" ON campaigns;

-- Criar políticas mais permissivas
CREATE POLICY "Permitir leitura de campanhas" ON campaigns
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de campanhas" ON campaigns
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de campanhas" ON campaigns
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verificar se RLS está habilitado
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
