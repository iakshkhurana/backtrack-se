-- ============================================
-- Profile Photo Storage Bucket Setup
-- ============================================
-- This script creates a storage bucket for user profile photos
-- Run this in Supabase SQL Editor
-- ============================================

-- Create storage bucket for profile photos
-- public = true means anyone with the URL can view the images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  2097152, -- 2MB limit for profile photos
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ============================================
-- Storage Policies for Profile Photos
-- ============================================

-- Drop existing storage policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;

-- Policy 1: Anyone can view profile photos (public read access)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Policy 2: Users can upload their own profile photos
-- Users can only upload to their own folder (user_id/)
-- The path format should be: {user_id}/avatar.{ext}
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own profile photos
CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own profile photos
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Profile Photo Storage Bucket Created!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Bucket: profile-photos';
  RAISE NOTICE 'Size limit: 2MB';
  RAISE NOTICE 'Allowed types: JPEG, JPG, PNG, WEBP';
  RAISE NOTICE '';
  RAISE NOTICE 'Storage policies have been created.';
  RAISE NOTICE 'Users can now upload their profile photos.';
  RAISE NOTICE '============================================';
END $$;

