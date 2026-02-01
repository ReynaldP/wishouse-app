-- =============================================
-- MIGRATION: Ajout du suivi des prix
-- Project: Wishouse (ufzobdqpbwwcmfkiriwh)
-- À exécuter dans Supabase SQL Editor
-- =============================================

-- 1. Ajouter les nouvelles colonnes à la table products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS target_price DECIMAL(12, 2) DEFAULT NULL;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_alert_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Créer le type ENUM pour la source des prix
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'price_source') THEN
        CREATE TYPE price_source AS ENUM ('manual', 'auto_check', 'web_clipper');
    END IF;
END$$;

-- 3. Créer la table price_history
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  source price_source NOT NULL DEFAULT 'manual',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Créer les index pour la performance
CREATE INDEX IF NOT EXISTS idx_price_history_product_id
ON price_history(product_id);

CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at
ON price_history(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_price_alert
ON products(price_alert_enabled)
WHERE price_alert_enabled = TRUE;

-- 5. Activer Row Level Security sur price_history
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer les politiques si elles existent déjà (pour éviter les erreurs)
DROP POLICY IF EXISTS "Users can view price history of their products" ON price_history;
DROP POLICY IF EXISTS "Users can create price history for their products" ON price_history;
DROP POLICY IF EXISTS "Users can delete price history of their products" ON price_history;

-- 7. Créer les politiques RLS pour price_history
CREATE POLICY "Users can view price history of their products"
ON price_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = price_history.product_id
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create price history for their products"
ON price_history FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = price_history.product_id
    AND products.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete price history of their products"
ON price_history FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = price_history.product_id
    AND products.user_id = auth.uid()
  )
);

-- 8. Vérification
SELECT 'Migration terminée avec succès!' as status;
