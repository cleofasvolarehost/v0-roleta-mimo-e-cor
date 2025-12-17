-- Remover restrição de e-mail único e torná-lo opcional
ALTER TABLE public.players 
  DROP CONSTRAINT IF EXISTS players_email_key;

-- Tornar e-mail opcional (nullable)
ALTER TABLE public.players 
  ALTER COLUMN email DROP NOT NULL;
