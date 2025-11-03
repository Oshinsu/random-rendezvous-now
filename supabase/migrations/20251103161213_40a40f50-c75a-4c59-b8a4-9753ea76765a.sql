-- Create user_gender_cache table for Phase 2 optimization
CREATE TABLE IF NOT EXISTS public.user_gender_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender TEXT NOT NULL CHECK (gender IN ('homme', 'femme', 'doute')),
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_gender CHECK (
    (confidence < 0.6 AND gender = 'doute') OR confidence >= 0.6
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_gender_cache_detected ON public.user_gender_cache(detected_at DESC);

-- Enable RLS
ALTER TABLE public.user_gender_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can read/write (using user_roles table)
CREATE POLICY "Admin can manage gender cache" ON public.user_gender_cache
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Comment for documentation
COMMENT ON TABLE public.user_gender_cache IS 'Cache de détection de genre via Lovable AI. Expire après 30 jours. Usage: analytics admin uniquement (RGPD compliant).';
COMMENT ON COLUMN public.user_gender_cache.gender IS 'Genre inféré: homme, femme, ou doute si ambigu/inconnu';
COMMENT ON COLUMN public.user_gender_cache.confidence IS 'Score de confiance de 0 à 1 (0.9+ = très sûr, <0.6 = doute forcé)';