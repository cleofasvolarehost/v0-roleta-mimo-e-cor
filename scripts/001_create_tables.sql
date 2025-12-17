-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prizes table
CREATE TABLE IF NOT EXISTS public.prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  probability DECIMAL(5,2) NOT NULL CHECK (probability >= 0 AND probability <= 100),
  color TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spins table
CREATE TABLE IF NOT EXISTS public.spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES public.prizes(id) ON DELETE CASCADE,
  spun_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players (public can register)
CREATE POLICY "Anyone can register as player"
  ON public.players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can view all players"
  ON public.players FOR SELECT
  USING (true);

-- RLS Policies for prizes (public can view active prizes)
CREATE POLICY "Anyone can view active prizes"
  ON public.prizes FOR SELECT
  USING (is_active = true);

-- RLS Policies for spins (public can create and view)
CREATE POLICY "Anyone can create spins"
  ON public.spins FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view all spins"
  ON public.spins FOR SELECT
  USING (true);

-- Insert default prizes
INSERT INTO public.prizes (name, description, probability, color, icon) VALUES
  ('10% de Desconto', 'Ganhe 10% de desconto na sua próxima compra!', 25.00, '#E91E8C', '🎁'),
  ('Frete Grátis', 'Frete grátis em qualquer pedido!', 20.00, '#FF6B9D', '📦'),
  ('Brinde Especial', 'Um brinde exclusivo Mimo e Cor!', 15.00, '#C41E6B', '🎀'),
  ('20% de Desconto', 'Ganhe 20% de desconto na sua próxima compra!', 10.00, '#A01558', '💝'),
  ('Vale-Compra R$50', 'Um vale-compra de R$50!', 8.00, '#FF85B3', '💰'),
  ('Produto Grátis', 'Escolha um produto grátis da coleção!', 5.00, '#E91E8C', '🌟'),
  ('Tente Novamente', 'Não foi dessa vez, mas você pode girar novamente!', 17.00, '#FFB3D1', '🔄')
ON CONFLICT DO NOTHING;
