-- =============================================
-- Storage Buckets & Policies for mytripfy
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create all required buckets (public = accessible without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',        'avatars',        true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('photos',         'photos',         true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('guide-media',    'guide-media',    true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('certifications', 'certifications', true,  10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- =============================================
-- RLS Policies for each bucket
-- =============================================

-- ── avatars ──────────────────────────────────
-- Anyone can view
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder
CREATE POLICY "avatars: auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update/delete their own files
CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "avatars: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());


-- ── photos ───────────────────────────────────
CREATE POLICY "photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "photos: auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "photos: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'photos' AND owner = auth.uid());

CREATE POLICY "photos: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos' AND owner = auth.uid());


-- ── guide-media ──────────────────────────────
CREATE POLICY "guide-media: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'guide-media');

CREATE POLICY "guide-media: auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'guide-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "guide-media: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'guide-media' AND owner = auth.uid());

CREATE POLICY "guide-media: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'guide-media' AND owner = auth.uid());


-- ── certifications ───────────────────────────
CREATE POLICY "certifications: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certifications');

CREATE POLICY "certifications: auth upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certifications' AND auth.role() = 'authenticated');

CREATE POLICY "certifications: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'certifications' AND owner = auth.uid());
