-- Migration: Create issue-photos storage bucket and RLS policies
-- This migration sets up Supabase Storage for photo uploads in Civica
--
-- Storage path convention: {user_id}/{timestamp}-{filename}
-- Example: abc123-def456/1701619200000-photo.jpg

-- ============================================
-- 1. CREATE STORAGE BUCKET
-- ============================================

-- Create the issue-photos bucket with configuration
-- Using ON CONFLICT to make this migration idempotent
-- Bucket is public for read access (approved issues are shared publicly)
-- RLS policies control write/delete operations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'issue-photos',
  'issue-photos',
  true,   -- Public bucket for read access (getPublicUrl works)
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- 2. RLS POLICIES FOR STORAGE
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Policy: Authenticated users can upload photos to their own folder
-- Path must start with user's UUID
CREATE POLICY "Users can upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'issue-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view photos via Supabase client (list, download operations)
-- Note: For public buckets, direct URL access (getPublicUrl) works without this policy.
-- This policy enables programmatic access via Supabase client for anon/authenticated users.
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'issue-photos');

-- Policy: Users can update (replace) their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'issue-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'issue-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'issue-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
