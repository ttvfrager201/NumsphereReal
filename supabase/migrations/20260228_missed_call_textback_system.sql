-- =====================================================
-- Missed Call Text-Back System Enhancement
-- =====================================================

-- 1. Add auto_text_enabled toggle to call_forwarding_configs
ALTER TABLE public.call_forwarding_configs
  ADD COLUMN IF NOT EXISTS auto_text_enabled boolean DEFAULT false;

-- 2. Add call tracking fields to missed_calls for deduplication
ALTER TABLE public.missed_calls
  ADD COLUMN IF NOT EXISTS twilio_call_sid text,
  ADD COLUMN IF NOT EXISTS call_direction text DEFAULT 'inbound',
  ADD COLUMN IF NOT EXISTS sms_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS auto_texted boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS missed_calls_twilio_call_sid_idx ON public.missed_calls(twilio_call_sid);
CREATE INDEX IF NOT EXISTS missed_calls_status_idx ON public.missed_calls(status);
CREATE INDEX IF NOT EXISTS missed_calls_called_at_idx ON public.missed_calls(called_at DESC);

-- 3. Create a call_logs table for detailed Twilio event tracking
CREATE TABLE IF NOT EXISTS public.call_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    twilio_call_sid text NOT NULL,
    caller_number text NOT NULL,
    called_number text NOT NULL,
    forward_to_number text,
    call_status text NOT NULL DEFAULT 'ringing',
    call_duration integer DEFAULT 0,
    missed_call_id uuid REFERENCES public.missed_calls(id) ON DELETE SET NULL,
    raw_payload jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS call_logs_user_id_idx ON public.call_logs(user_id);
CREATE INDEX IF NOT EXISTS call_logs_twilio_call_sid_idx ON public.call_logs(twilio_call_sid);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own call logs" ON public.call_logs;
CREATE POLICY "Users can view own call logs" ON public.call_logs
    FOR SELECT USING (auth.uid()::text = user_id);

-- 4. Allow service role to insert/update missed_calls (webhooks run without user auth)
DROP POLICY IF EXISTS "Service role full access missed_calls" ON public.missed_calls;
CREATE POLICY "Service role full access missed_calls" ON public.missed_calls
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access call_logs" ON public.call_logs;
CREATE POLICY "Service role full access call_logs" ON public.call_logs
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable realtime on missed_calls for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.missed_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
