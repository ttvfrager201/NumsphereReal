-- Add Stripe Connect account ID to business profiles
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS payments_enabled boolean DEFAULT false;
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS available_hours jsonb DEFAULT '{"monday":{"enabled":true,"start":"09:00","end":"17:00"},"tuesday":{"enabled":true,"start":"09:00","end":"17:00"},"wednesday":{"enabled":true,"start":"09:00","end":"17:00"},"thursday":{"enabled":true,"start":"09:00","end":"17:00"},"friday":{"enabled":true,"start":"09:00","end":"17:00"},"saturday":{"enabled":false,"start":"09:00","end":"17:00"},"sunday":{"enabled":false,"start":"09:00","end":"17:00"}}';
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS slot_duration integer DEFAULT 30;

-- Services table for each business profile
CREATE TABLE IF NOT EXISTS public.services (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    user_id text,
    name text NOT NULL,
    description text,
    duration_minutes integer NOT NULL DEFAULT 30,
    price decimal(10,2) NOT NULL DEFAULT 0,
    is_paid boolean DEFAULT false,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own services" ON public.services;
CREATE POLICY "Users can view own services" ON public.services
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert services" ON public.services;
CREATE POLICY "Users can insert services" ON public.services
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own services" ON public.services;
CREATE POLICY "Users can update own services" ON public.services
    FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own services" ON public.services;
CREATE POLICY "Users can delete own services" ON public.services
    FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services" ON public.services
    FOR SELECT USING (is_active = true);

CREATE INDEX IF NOT EXISTS services_business_profile_id_idx ON public.services(business_profile_id);
CREATE INDEX IF NOT EXISTS services_user_id_idx ON public.services(user_id);

-- Add payment fields to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_amount decimal(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  END IF;
END $$;
