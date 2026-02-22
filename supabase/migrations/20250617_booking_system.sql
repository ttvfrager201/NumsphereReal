-- Create bookings table with all needed columns
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text,
    customer_name text NOT NULL,
    customer_email text,
    customer_phone text,
    service_type text NOT NULL DEFAULT 'Appointment',
    appointment_time timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'rescheduled')),
    payment_status text DEFAULT 'not_required' CHECK (payment_status IN ('paid', 'pending', 'not_required')),
    business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    missed_call_id uuid,
    reschedule_token uuid DEFAULT gen_random_uuid(),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_business_profile_id_idx ON public.bookings(business_profile_id);
CREATE INDEX IF NOT EXISTS bookings_reschedule_token_idx ON public.bookings(reschedule_token);
CREATE INDEX IF NOT EXISTS bookings_appointment_time_idx ON public.bookings(appointment_time);

-- Owner can view their bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid()::text = user_id);

-- Owner can update their bookings
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Owner can delete their bookings
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;
CREATE POLICY "Users can delete own bookings" ON public.bookings
    FOR DELETE USING (auth.uid()::text = user_id);

-- Allow public to insert bookings (customers booking via public link)
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings
    FOR INSERT WITH CHECK (true);

-- Allow public to read bookings by reschedule token (for reschedule page)
DROP POLICY IF EXISTS "Public can view bookings by token" ON public.bookings;
CREATE POLICY "Public can view bookings by token" ON public.bookings
    FOR SELECT USING (reschedule_token IS NOT NULL);

-- Allow public to update bookings (for reschedule)
DROP POLICY IF EXISTS "Public can update bookings for reschedule" ON public.bookings;
CREATE POLICY "Public can update bookings for reschedule" ON public.bookings
    FOR UPDATE USING (reschedule_token IS NOT NULL);

-- Enable realtime for bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;
