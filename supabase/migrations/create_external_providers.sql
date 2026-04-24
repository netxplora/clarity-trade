-- ============================================================
-- External Crypto Providers & Purchase Tracking
-- ============================================================

-- 1. External Providers Management
CREATE TABLE IF NOT EXISTS public.crypto_providers (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name       TEXT NOT NULL,
  provider_url        TEXT NOT NULL,
  provider_logo       TEXT,
  provider_description TEXT,
  provider_priority   INTEGER DEFAULT 100,
  provider_status     TEXT DEFAULT 'Active' CHECK (provider_status IN ('Active', 'Inactive')),
  provider_type       TEXT DEFAULT 'Secondary' CHECK (provider_type IN ('Primary', 'Secondary', 'Backup')),
  supported_assets    TEXT[], -- Array of symbols like ['BTC', 'ETH']
  supported_regions   TEXT[], -- Array of country codes or names
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 2. Purchase Session Tracking (Audit Intent)
CREATE TABLE IF NOT EXISTS public.external_purchase_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id     UUID REFERENCES public.crypto_providers(id) ON DELETE SET NULL,
  asset           TEXT NOT NULL,
  network         TEXT NOT NULL,
  wallet_address  TEXT NOT NULL,
  status          TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'completed', 'abandoned')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.crypto_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_purchase_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Providers
CREATE POLICY "Anyone can view active providers" 
  ON public.crypto_providers FOR SELECT 
  USING (provider_status = 'Active');

CREATE POLICY "Admins can manage providers" 
  ON public.crypto_providers FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Policies for Sessions
CREATE POLICY "Users can view own purchase sessions" 
  ON public.external_purchase_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own purchase sessions" 
  ON public.external_purchase_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchase sessions" 
  ON public.external_purchase_sessions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_crypto_providers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crypto_providers_timestamp
  BEFORE UPDATE ON public.crypto_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_crypto_providers_timestamp();
