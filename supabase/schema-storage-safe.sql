-- =============================================
-- Storage Buckets ONLY (policies 없이)
-- 이미 policy 오류가 나면 이걸 실행하세요
-- =============================================

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
