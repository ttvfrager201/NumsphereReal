-- Numsphere Schema Extensions

-- Missed Calls Table
CREATE TABLE IF NOT EXISTS public.missed_calls (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    caller_name text,
    phone_number text NOT NULL,
    called_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'texted', 'booked', 'handled', 'ignored')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    service_type text NOT NULL,
    appointment_time timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    payment_status text DEFAULT 'not_required' CHECK (payment_status IN ('paid', 'pending', 'not_required')),
    missed_call_id uuid REFERENCES public.missed_calls(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE UNIQUE,
    booking_link_template text DEFAULT 'Hi! Sorry I missed your call. You can book an appointment here: [LINK]',
    stripe_connect_id text,
    review_automation_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.missed_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policies for missed_calls
CREATE POLICY "Users can view own missed calls" ON public.missed_calls
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own missed calls" ON public.missed_calls
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own missed calls" ON public.missed_calls
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own missed calls" ON public.missed_calls
    FOR DELETE USING (auth.uid()::text = user_id);

-- Policies for bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own bookings" ON public.bookings
    FOR DELETE USING (auth.uid()::text = user_id);

-- Policies for settings
CREATE POLICY "Users can view own settings" ON public.settings
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own settings" ON public.settings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own settings" ON public.settings
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS missed_calls_user_id_idx ON public.missed_calls(user_id);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS settings_user_id_idx ON public.settings(user_id);
