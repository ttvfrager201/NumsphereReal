-- Allow users to have multiple business profiles / booking links
-- Remove the UNIQUE constraint on user_id

ALTER TABLE public.business_profiles DROP CONSTRAINT IF EXISTS business_profiles_user_id_key;

-- Drop the old unique index if it exists
DROP INDEX IF EXISTS business_profiles_user_id_key;

-- Keep the index for query performance (non-unique)
DROP INDEX IF EXISTS business_profiles_user_id_idx;
CREATE INDEX IF NOT EXISTS business_profiles_user_id_idx ON public.business_profiles(user_id);
