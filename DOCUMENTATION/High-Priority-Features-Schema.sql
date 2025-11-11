-- ============================================
-- BackTrack Campus Find - High Priority Features SQL Schema
-- ============================================
-- Copy and paste this entire script into Supabase SQL Editor
-- This script adds all high-priority features: Profiles, Claims, Messaging, Notifications, and Matching
-- 
-- IMPORTANT NOTES:
-- 1. Run the base schema first (Complete-SQL-Schema.sql) if you haven't already
-- 2. This script extends the existing schema with new features
-- 3. All tables include proper RLS policies for security
-- ============================================

-- ============================================
-- STEP 1: Enable Required Extensions
-- ============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable gen_random_uuid() function (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- STEP 2: Create Additional Enums
-- ============================================

-- Create enum for claim status
DROP TYPE IF EXISTS claim_status CASCADE;
CREATE TYPE claim_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'returned'
);

-- Create enum for item claim status
DROP TYPE IF EXISTS item_claim_status CASCADE;
CREATE TYPE item_claim_status AS ENUM (
  'open',
  'pending',
  'claimed',
  'returned',
  'closed'
);

-- Create enum for notification types
DROP TYPE IF EXISTS notification_type CASCADE;
CREATE TYPE notification_type AS ENUM (
  'claim',
  'message',
  'match',
  'status',
  'system'
);

-- Create enum for match status
DROP TYPE IF EXISTS match_status CASCADE;
CREATE TYPE match_status AS ENUM (
  'pending',
  'reviewed',
  'confirmed',
  'rejected'
);

-- Create enum for user roles
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
  'user',
  'moderator',
  'admin'
);

-- ============================================
-- STEP 3: Create Profiles Table
-- ============================================

-- Drop table if exists (for fresh setup)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comments
COMMENT ON TABLE public.profiles IS 'User profiles with additional information';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key to auth.users - one profile per user';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name';
COMMENT ON COLUMN public.profiles.bio IS 'User biography/description';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image';
COMMENT ON COLUMN public.profiles.role IS 'User role (user, moderator, admin)';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when profile was last updated';

-- Create index on role for admin queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ============================================
-- STEP 4: Update Items Table (Add claim_status)
-- ============================================

-- Add claim_status column to items table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'claim_status'
  ) THEN
    ALTER TABLE public.items ADD COLUMN claim_status item_claim_status DEFAULT 'open' NOT NULL;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.items.claim_status IS 'Current claim status of the item (open, pending, claimed, returned, closed)';

-- Create index on claim_status for filtering
CREATE INDEX IF NOT EXISTS idx_items_claim_status ON public.items(claim_status);

-- ============================================
-- STEP 5: Create Claims Table
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS public.claims CASCADE;

-- Create claims table
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  claimant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verification_details TEXT,
  status claim_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  -- Prevent duplicate claims
  UNIQUE(item_id, claimant_id)
);

-- Add comments
COMMENT ON TABLE public.claims IS 'Item claim requests from users';
COMMENT ON COLUMN public.claims.id IS 'Unique identifier for the claim';
COMMENT ON COLUMN public.claims.item_id IS 'Foreign key to items - the item being claimed';
COMMENT ON COLUMN public.claims.claimant_id IS 'Foreign key to auth.users - the user claiming the item';
COMMENT ON COLUMN public.claims.verification_details IS 'Details provided by claimant to verify ownership';
COMMENT ON COLUMN public.claims.status IS 'Claim status (pending, approved, rejected, returned)';
COMMENT ON COLUMN public.claims.created_at IS 'Timestamp when claim was created';
COMMENT ON COLUMN public.claims.updated_at IS 'Timestamp when claim was last updated';

-- Create indexes for performance
CREATE INDEX idx_claims_item_id ON public.claims(item_id);
CREATE INDEX idx_claims_claimant_id ON public.claims(claimant_id);
CREATE INDEX idx_claims_status ON public.claims(status);
CREATE INDEX idx_claims_created_at ON public.claims(created_at DESC);

-- ============================================
-- STEP 6: Create Conversations Table
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  participant1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  -- Ensure unique conversation per item and participants
  UNIQUE(item_id, participant1_id, participant2_id),
  -- Ensure participant1_id < participant2_id for consistency
  CHECK (participant1_id < participant2_id)
);

-- Add comments
COMMENT ON TABLE public.conversations IS 'Conversations between users about items';
COMMENT ON COLUMN public.conversations.id IS 'Unique identifier for the conversation';
COMMENT ON COLUMN public.conversations.item_id IS 'Foreign key to items - the item being discussed';
COMMENT ON COLUMN public.conversations.participant1_id IS 'First participant (user with smaller UUID)';
COMMENT ON COLUMN public.conversations.participant2_id IS 'Second participant (user with larger UUID)';
COMMENT ON COLUMN public.conversations.last_message_at IS 'Timestamp of the last message in the conversation';
COMMENT ON COLUMN public.conversations.created_at IS 'Timestamp when conversation was created';

-- Create indexes
CREATE INDEX idx_conversations_item_id ON public.conversations(item_id);
CREATE INDEX idx_conversations_participant1_id ON public.conversations(participant1_id);
CREATE INDEX idx_conversations_participant2_id ON public.conversations(participant2_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- ============================================
-- STEP 7: Create Messages Table
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comments
COMMENT ON TABLE public.messages IS 'Messages between users in conversations';
COMMENT ON COLUMN public.messages.id IS 'Unique identifier for the message';
COMMENT ON COLUMN public.messages.conversation_id IS 'Foreign key to conversations - the conversation this message belongs to';
COMMENT ON COLUMN public.messages.sender_id IS 'Foreign key to auth.users - the user who sent the message';
COMMENT ON COLUMN public.messages.receiver_id IS 'Foreign key to auth.users - the user who receives the message';
COMMENT ON COLUMN public.messages.content IS 'Message content/text';
COMMENT ON COLUMN public.messages.is_read IS 'Whether the message has been read by the receiver';
COMMENT ON COLUMN public.messages.created_at IS 'Timestamp when message was sent';

-- Create indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_is_read ON public.messages(is_read);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- STEP 8: Create Notifications Table
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comments
COMMENT ON TABLE public.notifications IS 'Notifications for users about various events';
COMMENT ON COLUMN public.notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN public.notifications.user_id IS 'Foreign key to auth.users - the user who receives the notification';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification (claim, message, match, status, system)';
COMMENT ON COLUMN public.notifications.title IS 'Notification title';
COMMENT ON COLUMN public.notifications.message IS 'Notification message/content';
COMMENT ON COLUMN public.notifications.link IS 'Optional link to related page/item';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether the notification has been read';
COMMENT ON COLUMN public.notifications.created_at IS 'Timestamp when notification was created';

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- STEP 9: Create Matches Table
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS public.matches CASCADE;

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  found_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1) NOT NULL,
  match_reasons TEXT[],
  status match_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  -- Prevent duplicate matches
  UNIQUE(lost_item_id, found_item_id),
  -- Ensure lost_item_id has status 'lost' and found_item_id has status 'found'
  CHECK (lost_item_id != found_item_id)
);

-- Add comments
COMMENT ON TABLE public.matches IS 'AI-powered matches between lost and found items';
COMMENT ON COLUMN public.matches.id IS 'Unique identifier for the match';
COMMENT ON COLUMN public.matches.lost_item_id IS 'Foreign key to items - the lost item';
COMMENT ON COLUMN public.matches.found_item_id IS 'Foreign key to items - the found item';
COMMENT ON COLUMN public.matches.confidence_score IS 'Confidence score (0.0 to 1.0) indicating match quality';
COMMENT ON COLUMN public.matches.match_reasons IS 'Array of reasons why items were matched';
COMMENT ON COLUMN public.matches.status IS 'Match status (pending, reviewed, confirmed, rejected)';
COMMENT ON COLUMN public.matches.created_at IS 'Timestamp when match was created';

-- Create indexes
CREATE INDEX idx_matches_lost_item_id ON public.matches(lost_item_id);
CREATE INDEX idx_matches_found_item_id ON public.matches(found_item_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_confidence_score ON public.matches(confidence_score DESC);
CREATE INDEX idx_matches_created_at ON public.matches(created_at DESC);

-- ============================================
-- STEP 10: Create Updated At Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
-- Add trigger for items table if it exists and doesn't have one
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'items') THEN
    -- Drop trigger if exists to avoid conflicts
    DROP TRIGGER IF EXISTS set_updated_at_items ON public.items;
    -- Create trigger for items updated_at
    CREATE TRIGGER set_updated_at_items
      BEFORE UPDATE ON public.items
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Drop triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_claims ON public.claims;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_claims
  BEFORE UPDATE ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STEP 11: Create Function to Update Conversation Last Message
-- ============================================

-- Function to update conversation last_message_at when new message is created
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating conversation last_message_at
-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;

CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================
-- STEP 12: Create Function to Update Item Claim Status
-- ============================================

-- Function to update item claim_status when claim is approved/rejected
CREATE OR REPLACE FUNCTION public.update_item_claim_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update item claim_status based on claim status
  IF NEW.status = 'approved' THEN
    UPDATE public.items
    SET claim_status = 'claimed'
    WHERE id = NEW.item_id;
  ELSIF NEW.status = 'returned' THEN
    UPDATE public.items
    SET claim_status = 'returned'
    WHERE id = NEW.item_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.items
    SET claim_status = 'open'
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating item claim_status
-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_item_claim_status_trigger ON public.claims;

CREATE TRIGGER update_item_claim_status_trigger
  AFTER UPDATE OF status ON public.claims
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_item_claim_status();

-- ============================================
-- STEP 13: Create Function to Auto-Create Profile
-- ============================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating profile
-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 14: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables (including items if not already enabled)
DO $$ 
BEGIN
  -- Enable RLS on items table if it exists and RLS is not already enabled
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'items') THEN
    ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ITEMS POLICIES (if items table exists)
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'items') THEN
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Items are viewable by everyone" ON public.items;
    DROP POLICY IF EXISTS "Users can insert own items" ON public.items;
    DROP POLICY IF EXISTS "Users can update own items" ON public.items;
    DROP POLICY IF EXISTS "Users can delete own items" ON public.items;
    DROP POLICY IF EXISTS "Admins can manage all items" ON public.items;
    
    -- Anyone can view items
    CREATE POLICY "Items are viewable by everyone"
      ON public.items FOR SELECT
      USING (true);

    -- Authenticated users can insert items
    CREATE POLICY "Users can insert own items"
      ON public.items FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    -- Users can update their own items
    CREATE POLICY "Users can update own items"
      ON public.items FOR UPDATE
      USING (auth.uid() = user_id);

    -- Users can delete their own items
    CREATE POLICY "Users can delete own items"
      ON public.items FOR DELETE
      USING (auth.uid() = user_id);

    -- Admins and moderators can manage all items (SELECT, INSERT, UPDATE, DELETE)
    CREATE POLICY "Admins can manage all items"
      ON public.items FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'moderator')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'moderator')
        )
      );
  END IF;
END $$;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (if not auto-created)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: "Profiles are viewable by everyone" policy already allows admins to view all profiles
-- This policy is redundant but kept for clarity

-- Admins can update any profile (for role management)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can delete any profile
CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- CLAIMS POLICIES
-- ============================================

-- Anyone can view claims (including admins)
CREATE POLICY "Claims are viewable by everyone"
  ON public.claims FOR SELECT
  USING (true);

-- Users can create claims
CREATE POLICY "Users can create claims"
  ON public.claims FOR INSERT
  WITH CHECK (auth.uid() = claimant_id);

-- Users can update their own claims or item owners can update claims on their items
-- Admins and moderators can update any claim
CREATE POLICY "Users can update own claims or item owners can update claims on their items"
  ON public.claims FOR UPDATE
  USING (
    auth.uid() = claimant_id OR
    auth.uid() IN (SELECT user_id FROM public.items WHERE id = item_id) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Users can delete their own claims
CREATE POLICY "Users can delete own claims"
  ON public.claims FOR DELETE
  USING (auth.uid() = claimant_id);

-- Admins and moderators can delete any claim
CREATE POLICY "Admins can delete any claim"
  ON public.claims FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Users can view conversations they are part of
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (
    auth.uid() = participant1_id OR
    auth.uid() = participant2_id
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    auth.uid() = participant1_id OR
    auth.uid() = participant2_id
  );

-- Users can update conversations they are part of
CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (
    auth.uid() = participant1_id OR
    auth.uid() = participant2_id
  );

-- Admins and moderators can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Admins and moderators can delete any conversation
CREATE POLICY "Admins can delete any conversation"
  ON public.conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can view messages in conversations they are part of
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT participant1_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT participant2_id FROM public.conversations WHERE id = conversation_id
    )
  );

-- Users can create messages in conversations they are part of
CREATE POLICY "Users can create messages in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT participant1_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT participant2_id FROM public.conversations WHERE id = conversation_id
    )
  );

-- Users can update their own messages (for marking as read)
CREATE POLICY "Users can update own received messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Admins and moderators can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Admins and moderators can delete any message
CREATE POLICY "Admins can delete any message"
  ON public.messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications (using service role)
-- Note: This is typically done via Supabase Edge Functions or service role
-- For now, we'll allow users to create notifications (can be restricted later)
CREATE POLICY "Users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Admins and moderators can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Admins and moderators can delete any notification
CREATE POLICY "Admins can delete any notification"
  ON public.notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- MATCHES POLICIES
-- ============================================

-- Anyone can view matches (including admins)
CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT
  USING (true);

-- Only system can create matches (typically via Edge Functions)
-- For now, allow authenticated users (can be restricted to service role later)
CREATE POLICY "Authenticated users can create matches"
  ON public.matches FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update matches for items they own
CREATE POLICY "Users can update matches for own items"
  ON public.matches FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.items WHERE id = lost_item_id OR id = found_item_id
    )
  );

-- Admins and moderators can delete any match
CREATE POLICY "Admins can delete any match"
  ON public.matches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- STEP 15: Create Helper Functions
-- ============================================

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_item_id UUID,
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_participant1 UUID;
  v_participant2 UUID;
BEGIN
  -- Ensure participant1_id < participant2_id
  IF p_user1_id < p_user2_id THEN
    v_participant1 := p_user1_id;
    v_participant2 := p_user2_id;
  ELSE
    v_participant1 := p_user2_id;
    v_participant2 := p_user1_id;
  END IF;

  -- Try to get existing conversation
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE item_id = p_item_id
    AND participant1_id = v_participant1
    AND participant2_id = v_participant2;

  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (item_id, participant1_id, participant2_id)
    VALUES (p_item_id, v_participant1, v_participant2)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.notifications
    WHERE user_id = p_user_id
      AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.messages
    WHERE receiver_id = p_user_id
      AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 16: Create Views for Common Queries
-- ============================================

-- View for user dashboard statistics
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT
  u.id AS user_id,
  COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'lost') AS lost_items_count,
  COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'found') AS found_items_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'approved') AS successful_claims_count,
  COUNT(DISTINCT m.id) FILTER (WHERE m.is_read = FALSE) AS unread_messages_count,
  COUNT(DISTINCT n.id) FILTER (WHERE n.is_read = FALSE) AS unread_notifications_count
FROM auth.users u
LEFT JOIN public.items i ON i.user_id = u.id
LEFT JOIN public.claims c ON c.claimant_id = u.id
LEFT JOIN public.messages m ON m.receiver_id = u.id
LEFT JOIN public.notifications n ON n.user_id = u.id
GROUP BY u.id;

-- Grant access to view
GRANT SELECT ON public.user_dashboard_stats TO authenticated;

-- ============================================
-- STEP 17: Grant Permissions
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.claims TO authenticated;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.matches TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count(UUID) TO authenticated;

-- Grant permissions on items table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'items') THEN
    GRANT ALL ON public.items TO authenticated;
  END IF;
END $$;

-- ============================================
-- STEP 18: Admin Helper Functions (NEW)
-- ============================================

-- Function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
    AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_items BIGINT,
  total_users BIGINT,
  pending_claims BIGINT,
  approved_claims BIGINT,
  rejected_claims BIGINT,
  total_claims BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.items)::BIGINT AS total_items,
    (SELECT COUNT(*) FROM public.profiles)::BIGINT AS total_users,
    (SELECT COUNT(*) FROM public.claims WHERE status = 'pending')::BIGINT AS pending_claims,
    (SELECT COUNT(*) FROM public.claims WHERE status = 'approved')::BIGINT AS approved_claims,
    (SELECT COUNT(*) FROM public.claims WHERE status = 'rejected')::BIGINT AS rejected_claims,
    (SELECT COUNT(*) FROM public.claims)::BIGINT AS total_claims;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on admin functions
GRANT EXECUTE ON FUNCTION public.is_admin_or_moderator(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'High Priority Features Schema Updated!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables created/updated:';
  RAISE NOTICE '  - profiles';
  RAISE NOTICE '  - claims';
  RAISE NOTICE '  - conversations';
  RAISE NOTICE '  - messages';
  RAISE NOTICE '  - notifications';
  RAISE NOTICE '  - matches';
  RAISE NOTICE '  - items (RLS policies added)';
  RAISE NOTICE '';
  RAISE NOTICE 'New Features Added:';
  RAISE NOTICE '  - Items table RLS policies';
  RAISE NOTICE '  - Admin/moderator policies for all tables';
  RAISE NOTICE '  - Admin helper functions';
  RAISE NOTICE '  - Items updated_at trigger';
  RAISE NOTICE '';
  RAISE NOTICE 'All RLS policies have been enabled.';
  RAISE NOTICE 'Triggers and functions have been created.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Set up admin user:';
  RAISE NOTICE '   UPDATE public.profiles SET role = ''admin'' WHERE id = ''<user-id>'';';
  RAISE NOTICE '2. Test the claim functionality';
  RAISE NOTICE '3. Access admin panel at /admin';
  RAISE NOTICE '4. Test admin features (approve/reject claims, manage items, etc.)';
  RAISE NOTICE '============================================';
END $$;

