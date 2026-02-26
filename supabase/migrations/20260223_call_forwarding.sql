-- Add call forwarding configuration to settings table
ALTER TABLE public.settings 
  ADD COLUMN IF NOT EXISTS twilio_number text,
  ADD COLUMN IF NOT EXISTS twilio_number_sid text,
  ADD COLUMN IF NOT EXISTS forward_to_number text,
  ADD COLUMN IF NOT EXISTS sms_message_template text DEFAULT 'Hey! Sorry I missed your call. Here''s my booking link so you can grab a time that works for you: [LINK]',
  ADD COLUMN IF NOT EXISTS call_forwarding_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_slug text;

-- Create call_forwarding_logs table for tracking provisioned numbers per user
CREATE TABLE IF NOT EXISTS public.call_forwarding_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE UNIQUE,
    twilio_number text,
    twilio_number_sid text,
    forward_to_number text NOT NULL,
    sms_message_template text DEFAULT 'Hey! Sorry I missed your call. Here''s my booking link so you can grab a time that works for you: [LINK]',
    booking_slug text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.call_forwarding_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own call forwarding config" ON public.call_forwarding_configs
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own call forwarding config" ON public.call_forwarding_configs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own call forwarding config" ON public.call_forwarding_configs
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own call forwarding config" ON public.call_forwarding_configs
    FOR DELETE USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS call_forwarding_configs_user_id_idx ON public.call_forwarding_configs(user_id);
