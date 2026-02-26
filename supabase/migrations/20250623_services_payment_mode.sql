-- Add payment_mode to services (free, online, in_store)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'free' CHECK (payment_mode IN ('free', 'online', 'in_store'));

-- Allow pay_in_store in bookings payment_status
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('paid', 'pending', 'not_required', 'pay_in_store'));
