-- Private, server-mediated storage for profile photographs. Run manually in
-- the Supabase SQL editor after migration 007. Browser clients get no policy.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vevit-avatars', 'vevit-avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
COMMIT;
