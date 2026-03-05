-- Store the Stripe Express account ID at the user level so it persists
-- even when all booking links (business_profiles) are deleted.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- Backfill: copy existing stripe_account_id from the first business_profile
-- that has one, grouped by user.
UPDATE public.users u
SET stripe_account_id = (
  SELECT bp.stripe_account_id
  FROM public.business_profiles bp
  WHERE bp.user_id = u.user_id
    AND bp.stripe_account_id IS NOT NULL
  ORDER BY bp.created_at ASC
  LIMIT 1
)
WHERE u.stripe_account_id IS NULL;
