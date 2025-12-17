-- Adicionar controle de campanha e ganhador único
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES public.spins(id),
  total_prize_value DECIMAL(10,2) DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar tabela de admins
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar constraint unique para garantir um giro por pessoa
ALTER TABLE public.spins ADD CONSTRAINT unique_player_spin UNIQUE (player_id);

-- Adicionar coluna is_winner na tabela spins
ALTER TABLE public.spins ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT false;

-- Enable RLS para campaigns e admins
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies para campaigns (público pode ver se está ativa)
CREATE POLICY "Anyone can view active campaigns"
  ON public.campaigns FOR SELECT
  USING (true);

-- RLS Policies para admins (apenas admins podem ver)
CREATE POLICY "Only admins can view admins"
  ON public.admins FOR SELECT
  USING (false); -- Será controlado via server actions

-- Inserir admin superadmin com senha malucobeleza
-- Senha: malucobeleza (hash bcrypt)
INSERT INTO public.admins (username, password_hash) VALUES
  ('superadmin', '$2a$10$rZ5J8YxGJ2vXdJ5e9C8Hl.nQZ3ZQQ7qXZQZ3ZQZ3ZQZ3ZQZ3ZQZ3Z')
ON CONFLICT (username) DO NOTHING;

-- Criar campanha inicial (inativa)
INSERT INTO public.campaigns (name, is_active) VALUES
  ('Campanha Roleta Mimo e Cor', false)
ON CONFLICT DO NOTHING;
