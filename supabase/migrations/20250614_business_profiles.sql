CREATE TABLE IF NOT EXISTS public.business_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE UNIQUE,
    business_name text NOT NULL,
    address text,
    phone_number text,
    email text,
    logo_url text,
    booking_slug text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business profile" ON public.business_profiles;
CREATE POLICY "Users can view own business profile" ON public.business_profiles
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own business profile" ON public.business_profiles;
CREATE POLICY "Users can insert own business profile" ON public.business_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own business profile" ON public.business_profiles;
CREATE POLICY "Users can update own business profile" ON public.business_profiles
    FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own business profile" ON public.business_profiles;
CREATE POLICY "Users can delete own business profile" ON public.business_profiles
    FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Public can view business profiles by slug" ON public.business_profiles;
CREATE POLICY "Public can view business profiles by slug" ON public.business_profiles
    FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS business_profiles_user_id_idx ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS business_profiles_slug_idx ON public.business_profiles(booking_slug);
