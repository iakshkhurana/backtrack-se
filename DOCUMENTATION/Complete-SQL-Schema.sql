-- ============================================
-- BackTrack Campus Find - Complete SQL Schema
-- ============================================
-- Copy and paste this entire script into Supabase SQL Editor
-- This script sets up the complete database schema for the project
-- 
-- IMPORTANT NOTES:
-- 1. The auth.users table is automatically created by Supabase when you enable authentication
-- 2. You must enable authentication in Supabase Dashboard before running this script
-- 3. This script creates only the public.items table and related objects
-- ============================================

-- ============================================
-- STEP 1: Enable Required Extensions
-- ============================================

-- Enable UUID extension (usually already enabled, but safe to run)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable gen_random_uuid() function (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- STEP 2: Create Enums
-- ============================================

-- Create enum for item categories (drop if exists first)
DROP TYPE IF EXISTS item_category CASCADE;
CREATE TYPE item_category AS ENUM (
  'phone',
  'keys',
  'stationery',
  'electronics',
  'wallet',
  'clothing',
  'other'
);

-- Create enum for item status (drop if exists first)
DROP TYPE IF EXISTS item_status CASCADE;
CREATE TYPE item_status AS ENUM (
  'lost',
  'found'
);

-- ============================================
-- STEP 3: Create Items Table
-- ============================================

-- Drop table if exists (for fresh setup)
DROP TABLE IF EXISTS public.items CASCADE;

-- Create items table
-- Note: auth.users table is automatically created by Supabase when authentication is enabled
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category item_category NOT NULL,
  status item_status NOT NULL,
  location TEXT,
  date_reported TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_url TEXT,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE public.items IS 'Stores lost and found items posted by users';

-- Add comments to columns
COMMENT ON COLUMN public.items.id IS 'Unique identifier for the item';
COMMENT ON COLUMN public.items.user_id IS 'Foreign key to auth.users - the user who posted this item';
COMMENT ON COLUMN public.items.title IS 'Title/name of the item';
COMMENT ON COLUMN public.items.description IS 'Detailed description of the item';
COMMENT ON COLUMN public.items.category IS 'Category of the item (phone, keys, etc.)';
COMMENT ON COLUMN public.items.status IS 'Whether the item is lost or found';
COMMENT ON COLUMN public.items.location IS 'Location where item was lost or found';
COMMENT ON COLUMN public.items.date_reported IS 'Date when the item was reported';
COMMENT ON COLUMN public.items.image_url IS 'URL to the item image stored in Supabase Storage';
COMMENT ON COLUMN public.items.contact_info IS 'Contact information for the user';
COMMENT ON COLUMN public.items.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN public.items.updated_at IS 'Timestamp when the record was last updated';

-- ============================================
-- STEP 4: Create Indexes for Performance
-- ============================================

-- Create index on user_id for faster queries by user
CREATE INDEX idx_items_user_id ON public.items(user_id);

-- Create index on status for filtering lost/found items
CREATE INDEX idx_items_status ON public.items(status);

-- Create index on category for filtering by category
CREATE INDEX idx_items_category ON public.items(category);

-- Create index on date_reported for sorting by date (descending for newest first)
CREATE INDEX idx_items_date_reported ON public.items(date_reported DESC);

-- Create composite index for common query patterns (status + category)
CREATE INDEX idx_items_status_category ON public.items(status, category);

-- Create index on title for search functionality
CREATE INDEX idx_items_title ON public.items USING gin(to_tsvector('english', title));

-- ============================================
-- STEP 5: Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on items table
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Create RLS Policies
-- ============================================

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Anyone can view items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can create items" ON public.items;
DROP POLICY IF EXISTS "Users can update their own items" ON public.items;
DROP POLICY IF EXISTS "Users can delete their own items" ON public.items;

-- Policy 1: Anyone can view items (public read access)
-- This allows unauthenticated users to browse lost/found items
CREATE POLICY "Anyone can view items"
  ON public.items
  FOR SELECT
  USING (true);

-- Policy 2: Authenticated users can create items
-- Users can only create items with their own user_id
CREATE POLICY "Authenticated users can create items"
  ON public.items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own items
-- Users can only update items they created
CREATE POLICY "Users can update their own items"
  ON public.items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own items
-- Users can only delete items they created
CREATE POLICY "Users can delete their own items"
  ON public.items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 7: Create Update Timestamp Function
-- ============================================

-- Drop function if exists (for re-running script)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create function to automatically update updated_at timestamp
-- This function is called by a trigger whenever a row is updated
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically updates the updated_at timestamp when a row is updated';

-- ============================================
-- STEP 8: Create Trigger for Auto-Update
-- ============================================

-- Drop trigger if exists (for re-running script)
DROP TRIGGER IF EXISTS update_items_updated_at ON public.items;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STEP 9: Create Storage Bucket for Images
-- ============================================

-- Delete bucket if exists (for fresh setup)
-- Note: This will delete all images in the bucket if it exists
DELETE FROM storage.buckets WHERE id = 'item-images';

-- Create storage bucket for item images
-- public = true means anyone with the URL can view the images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images',
  'item-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- STEP 10: Create Storage Policies
-- ============================================

-- Drop existing storage policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Anyone can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own item images" ON storage.objects;

-- Policy 1: Anyone can view item images (public read access)
-- This allows anyone to view images if they have the URL
CREATE POLICY "Anyone can view item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

-- Policy 2: Authenticated users can upload item images
-- Users can only upload to their own folder (user_id/)
-- The path format should be: {user_id}/{filename}
CREATE POLICY "Authenticated users can upload item images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own item images
-- Users can only update images in their own folder
CREATE POLICY "Users can update their own item images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'item-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'item-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own item images
-- Users can only delete images in their own folder
CREATE POLICY "Users can delete their own item images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- STEP 11: Grant Permissions
-- ============================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on items table
-- authenticated users can SELECT, INSERT, UPDATE, DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;

-- anonymous users can only SELECT (read-only)
GRANT SELECT ON public.items TO anon;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- Grant usage on enums
GRANT USAGE ON TYPE item_category TO authenticated, anon;
GRANT USAGE ON TYPE item_status TO authenticated, anon;

-- ============================================
-- VERIFICATION QUERIES (Optional - for testing)
-- ============================================

-- Uncomment below to verify the setup after running the script:

-- Check if table exists
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'items';

-- Check if enums exist
-- SELECT typname FROM pg_type WHERE typname IN ('item_category', 'item_status');

-- Check table columns
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'items';

-- Check indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'items';

-- Check if storage bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'item-images';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'items';

-- Check storage policies
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check trigger
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement FROM information_schema.triggers WHERE event_object_table = 'items';

-- ============================================
-- END OF SCRIPT
-- ============================================
-- After running this script:
-- 1. Verify the table was created in Supabase Dashboard → Table Editor
-- 2. Check that storage bucket 'item-images' exists in Storage section
-- 3. Verify RLS policies are active in Authentication → Policies
-- 4. Test creating an item through your app
-- 5. Make sure authentication is enabled in Supabase Dashboard
-- ============================================
