# OAuth Setup (Google)

This project supports Google OAuth authentication. To enable Google sign-in, follow these steps:

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google+ API:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "BackTrack Campus Find" (or your choice)
   - **Authorized redirect URIs**: Add the following URL:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
     Replace `<your-project-ref>` with your Supabase project reference (found in your Supabase dashboard URL)
   - Click **Create**
   - **Copy the Client ID and Client Secret** (you'll need these for Step 2)

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** and click to configure
5. **Enable** the Google provider
6. Enter:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
7. Click **Save**

## Step 3: Configure Redirect URLs

1. In Supabase Dashboard: **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:5173/` (for local development)
   - `https://yourdomain.com/` (for production)

## Step 4: Set Site URL (Optional but Recommended)

1. In Supabase Dashboard: **Settings** → **Authentication**
2. Set **Site URL** to your app URL:
   - Development: `http://localhost:5173`
   - Production: your production domain

## Testing OAuth

1. Start your app: `npm run dev`
2. Navigate to `/auth`
3. Click **Continue with Google**
4. You should be redirected to Google sign-in, then back to your app

## Troubleshooting

- **"redirect_uri_mismatch" error**: Ensure the redirect URI in Google Cloud Console matches exactly: `https://<project-ref>.supabase.co/auth/v1/callback`
- **"Invalid client" error**: Verify the Client ID and Secret in Supabase match Google Cloud Console
- **OAuth not working**: Check that the Google provider is enabled in Supabase Dashboard

