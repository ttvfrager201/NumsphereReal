-- Fix: When a booking link (business_profile) is deleted, preserve all bookings/revenue/payment history.
-- Change ON DELETE CASCADE → ON DELETE SET NULL on bookings.business_profile_id
-- This way the booking record stays in the DB (revenue is preserved), but the link to the deleted profile becomes NULL.

-- Step 1: Drop the old FK constraint on bookings
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_business_profile_id_fkey;

-- Step 2: Re-add it with ON DELETE SET NULL
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_business_profile_id_fkey
  FOREIGN KEY (business_profile_id)
  REFERENCES public.business_profiles(id)
  ON DELETE SET NULL;

-- Services still cascade (those are configuration, not transaction history)
-- bookings now survive business_profile deletion
