-- ============================================
-- Chat History Migration - Add chat_id to items
-- ============================================
-- This migration adds a chat_id column to the items table
-- The chat_id will be the conversation.id from the conversations table
-- This ensures all users joining the same item chat use the same unique room ID
-- ============================================

-- Add chat_id column to items table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'items' 
    AND column_name = 'chat_id'
  ) THEN
    ALTER TABLE public.items 
    ADD COLUMN chat_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;
    
    -- Add comment
    COMMENT ON COLUMN public.items.chat_id IS 'Unique chat/conversation ID for this item - used as WebSocket room ID';
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_items_chat_id ON public.items(chat_id);
  END IF;
END $$;

-- ============================================
-- Function to get or create chat for an item
-- ============================================
-- This function creates a conversation for an item if it doesn't exist
-- It's designed for single-item chats (not participant-based)
CREATE OR REPLACE FUNCTION public.get_or_create_item_chat(
  p_item_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
  v_item_owner_id UUID;
BEGIN
  -- Get the item owner
  SELECT user_id INTO v_item_owner_id
  FROM public.items
  WHERE id = p_item_id;
  
  IF v_item_owner_id IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;
  
  -- Check if chat_id already exists on the item
  SELECT chat_id INTO v_chat_id
  FROM public.items
  WHERE id = p_item_id;
  
  -- If chat_id exists, return it
  IF v_chat_id IS NOT NULL THEN
    RETURN v_chat_id;
  END IF;
  
  -- Create a new conversation for this item
  -- For item chats, we'll use the item owner as participant1 and the current user as participant2
  -- But we need to ensure participant1_id < participant2_id
  IF v_item_owner_id < p_user_id THEN
    INSERT INTO public.conversations (item_id, participant1_id, participant2_id)
    VALUES (p_item_id, v_item_owner_id, p_user_id)
    RETURNING id INTO v_chat_id;
  ELSE
    INSERT INTO public.conversations (item_id, participant1_id, participant2_id)
    VALUES (p_item_id, p_user_id, v_item_owner_id)
    RETURNING id INTO v_chat_id;
  END IF;
  
  -- Update the item with the chat_id
  UPDATE public.items
  SET chat_id = v_chat_id
  WHERE id = p_item_id;
  
  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_or_create_item_chat(UUID, UUID) TO authenticated;

-- ============================================
-- Note: For existing items, you may want to backfill chat_id
-- Run this after creating the migration:
-- 
-- UPDATE public.items i
-- SET chat_id = (
--   SELECT c.id 
--   FROM public.conversations c 
--   WHERE c.item_id = i.id 
--   LIMIT 1
-- )
-- WHERE i.chat_id IS NULL;
-- ============================================

