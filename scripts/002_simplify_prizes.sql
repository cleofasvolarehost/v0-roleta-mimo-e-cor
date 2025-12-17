-- Remove all existing prizes
DELETE FROM prizes;

-- Insert only the 50 reais prize
INSERT INTO prizes (name, description, probability, color, icon, is_active)
VALUES (
  'Vale Compra R$ 50',
  'Vale compra de 50 reais para usar na loja Mimo e Cor',
  100,
  '#E91E8C',
  '🎁',
  true
);
