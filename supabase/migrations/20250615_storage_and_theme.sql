INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-logos',
  'business-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
CREATE POLICY "Anyone can view logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-logos');

DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'business-logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;
CREATE POLICY "Users can update their own logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own logos" ON storage.objects;
CREATE POLICY "Users can delete their own logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#ffffff';
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#0F766E';
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS dark_mode boolean DEFAULT true;
