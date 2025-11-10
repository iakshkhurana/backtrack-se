# Supabase Setup Guide - Complete Fresh Setup

This guide will help you set up Supabase from scratch for the BackTrack Campus Find project.

## Prerequisites

- A Supabase account (sign up at https://supabase.com if you don't have one)
- Your project code ready

## Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: BackTrack Campus Find (or your preferred name)
   - **Database Password**: Create a strong password (save this securely)
   - **Region**: Choose the closest region to your users
   - **Pricing Plan**: Select your plan (Free tier works for development)
4. Click **"Create new project"**
5. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase Dashboard, go to **Settings** → **API**
2. You'll need these values:
   - **Project URL**: Found under "Project URL" (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key**: Found under "Project API keys" → "anon" → "public" key
3. Copy both values - you'll need them for your `.env` file

## Step 3: Set Up Environment Variables

1. In your project root, create a `.env` file (if it doesn't exist)
2. Add the following variables:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here

# Optional: For AI features (voice assistant, image analysis)
VITE_OPENROUTER_API_KEY=your-openrouter-key-here
```

3. Replace:
   - `your-project-ref` with your actual project reference
   - `your-anon-public-key-here` with your actual anon public key
   - `your-openrouter-key-here` with your OpenRouter API key (if you have one)

## Step 4: Run the SQL Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open the file `DOCUMENTATION/Complete-SQL-Schema.sql` from your project
4. Copy the **entire contents** of the file
5. Paste it into the SQL Editor
6. Click **"Run"** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
7. Wait for the script to complete (should see "Success" message)

## Step 5: Verify the Setup

### Verify Table Creation

1. Go to **Table Editor** in Supabase Dashboard
2. You should see the `items` table
3. Click on it to see the columns:
   - id (uuid)
   - user_id (uuid)
   - title (text)
   - description (text)
   - category (item_category enum)
   - status (item_status enum)
   - location (text)
   - date_reported (timestamp)
   - image_url (text)
   - contact_info (text)
   - created_at (timestamp)
   - updated_at (timestamp)

### Verify Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. You should see a bucket named `item-images`
3. Click on it to verify it exists

### Verify RLS Policies

1. Go to **Authentication** → **Policies** in Supabase Dashboard
2. Click on the `items` table
3. You should see 4 policies:
   - "Anyone can view items"
   - "Authenticated users can create items"
   - "Users can update their own items"
   - "Users can delete their own items"

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your app (usually `http://localhost:5173`)

3. Try to:
   - Sign up/Sign in
   - Post an item
   - View lost/found items

4. If everything works, your setup is complete!

## Troubleshooting

### "relation does not exist" error
- **Solution**: Make sure you ran the complete SQL schema script. Go back to Step 4 and run it again.

### "permission denied" error
- **Solution**: Check that RLS policies are created correctly. Go to Authentication → Policies and verify all 4 policies exist.

### Storage bucket not found
- **Solution**: Check Storage section. If bucket doesn't exist, run the storage bucket creation part of the SQL script again.

### Can't upload images
- **Solution**: 
  1. Verify storage bucket exists
  2. Check storage policies are set correctly
  3. Ensure you're authenticated (signed in)

### Environment variables not working
- **Solution**: 
  1. Make sure `.env` file is in the project root
  2. Restart your dev server after adding/changing `.env` variables
  3. Check that variable names start with `VITE_`

## Important Notes

- **You can safely delete the `supabase/` folder** - it only contains migration files for reference
- The SQL schema file (`Complete-SQL-Schema.sql`) is the single source of truth for your database structure
- Always backup your database before making major changes
- The `item-images` storage bucket is public, so anyone with the URL can view images

## Next Steps

After setup is complete:
1. Configure Google OAuth (see `DOCUMENTATION/OAuth-Setup.md`)
2. Set up OpenRouter API key for AI features (optional)
3. Test all features of your application

## Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure SQL schema was run successfully

