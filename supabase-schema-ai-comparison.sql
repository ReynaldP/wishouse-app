-- AI Comparison Schema for Supabase
-- Run this SQL in your Supabase SQL Editor after the main schema

-- Table for storing AI comparison sessions
CREATE TABLE ai_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  intended_use TEXT NOT NULL,
  usage_conditions TEXT NOT NULL,
  best_choice_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for storing individual product results within a comparison
CREATE TABLE ai_comparison_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comparison_id UUID REFERENCES ai_comparisons(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  adjusted_score INTEGER NOT NULL CHECK (adjusted_score >= 0 AND adjusted_score <= 100),
  justification TEXT NOT NULL,
  is_best_choice BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comparison_id, product_id)
);

-- Indexes for better performance
CREATE INDEX idx_ai_comparisons_user_id ON ai_comparisons(user_id);
CREATE INDEX idx_ai_comparisons_created_at ON ai_comparisons(created_at DESC);
CREATE INDEX idx_ai_comparison_results_comparison_id ON ai_comparison_results(comparison_id);
CREATE INDEX idx_ai_comparison_results_product_id ON ai_comparison_results(product_id);

-- Enable Row Level Security
ALTER TABLE ai_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_comparison_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_comparisons
CREATE POLICY "Users can view their own ai_comparisons" ON ai_comparisons
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ai_comparisons" ON ai_comparisons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ai_comparisons" ON ai_comparisons
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ai_comparisons" ON ai_comparisons
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_comparison_results (based on comparison ownership)
CREATE POLICY "Users can view their ai_comparison_results" ON ai_comparison_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_comparisons
      WHERE ai_comparisons.id = ai_comparison_results.comparison_id
      AND ai_comparisons.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create their ai_comparison_results" ON ai_comparison_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_comparisons
      WHERE ai_comparisons.id = ai_comparison_results.comparison_id
      AND ai_comparisons.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete their ai_comparison_results" ON ai_comparison_results
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM ai_comparisons
      WHERE ai_comparisons.id = ai_comparison_results.comparison_id
      AND ai_comparisons.user_id = auth.uid()
    )
  );

-- Function to get the latest AI comparison result for a product
CREATE OR REPLACE FUNCTION get_latest_ai_comparison_for_product(p_product_id UUID, p_user_id UUID)
RETURNS TABLE (
  comparison_id UUID,
  intended_use TEXT,
  usage_conditions TEXT,
  adjusted_score INTEGER,
  justification TEXT,
  is_best_choice BOOLEAN,
  best_choice_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id as comparison_id,
    ac.intended_use,
    ac.usage_conditions,
    acr.adjusted_score,
    acr.justification,
    acr.is_best_choice,
    ac.best_choice_id,
    ac.created_at
  FROM ai_comparison_results acr
  JOIN ai_comparisons ac ON ac.id = acr.comparison_id
  WHERE acr.product_id = p_product_id
    AND ac.user_id = p_user_id
  ORDER BY ac.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
