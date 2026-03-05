-- Ensure stripe_account_id column exists on users table
-- so the Stripe Express account persists even when all booking links are deleted.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- Backfill: copy existing stripe_account_id from business_profiles to users
-- (only if users.stripe_account_id is still NULL)
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

-- Add an update policy for users so the edge function (service role) and
-- the authenticated user can update their own row (stripe_account_id).
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid()::text = user_id);
