# High Priority Features - Setup Guide

## Overview
This guide explains how to set up the high-priority features for BackTrack Campus Find, including Profiles, Claims, Messaging, Notifications, and Smart Matching.

## Files Created

1. **`DOCUMENTATION/High-Priority-Features-Schema.sql`** - Complete SQL schema for all high-priority features
2. **`src/integrations/supabase/types.ts`** - Updated TypeScript types for all new tables

## Setup Instructions

### Step 1: Run the SQL Schema

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file `DOCUMENTATION/High-Priority-Features-Schema.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

**Important Notes:**
- This script extends your existing schema (adds to `items` table)
- All tables include Row Level Security (RLS) policies
- Triggers are created automatically for `updated_at` timestamps
- A profile is automatically created when a user signs up

### Step 2: Verify Tables Created

After running the SQL, verify these tables were created:
- ✅ `profiles` - User profiles
- ✅ `claims` - Item claim requests
- ✅ `conversations` - User conversations
- ✅ `messages` - Messages between users
- ✅ `notifications` - User notifications
- ✅ `matches` - AI-powered item matches

### Step 3: TypeScript Types

The TypeScript types have been automatically updated in `src/integrations/supabase/types.ts`. You can now use these types in your code:

```typescript
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Example: Get user profile
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();

// Example: Create a claim
const { data: claim } = await supabase
  .from("claims")
  .insert({
    item_id: itemId,
    claimant_id: userId,
    verification_details: "Details here",
    status: "pending"
  });
```

## Features Included

### 1. User Profiles (`profiles` table)
- **Auto-created** when user signs up
- Fields: `id`, `full_name`, `bio`, `avatar_url`, `role`
- Roles: `user`, `moderator`, `admin`

**Usage:**
```typescript
// Get profile
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();

// Update profile
await supabase
  .from("profiles")
  .update({ full_name: "John Doe", bio: "Student" })
  .eq("id", userId);
```

### 2. Item Claims (`claims` table)
- Users can claim items they found/lost
- Status workflow: `pending` → `approved`/`rejected` → `returned`
- Automatically updates item `claim_status`

**Usage:**
```typescript
// Create claim
const { data } = await supabase
  .from("claims")
  .insert({
    item_id: itemId,
    claimant_id: userId,
    verification_details: "I lost this item on Monday",
    status: "pending"
  });

// Approve claim (item owner)
await supabase
  .from("claims")
  .update({ status: "approved" })
  .eq("id", claimId);
```

### 3. Messaging System (`conversations` + `messages` tables)
- Direct messaging between users
- Conversations are per item
- Helper function: `get_or_create_conversation()`

**Usage:**
```typescript
// Get or create conversation
const { data: conversationId } = await supabase
  .rpc("get_or_create_conversation", {
    p_item_id: itemId,
    p_user1_id: userId1,
    p_user2_id: userId2
  });

// Send message
await supabase
  .from("messages")
  .insert({
    conversation_id: conversationId,
    sender_id: userId1,
    receiver_id: userId2,
    content: "Hello!"
  });
```

### 4. Notifications (`notifications` table)
- Real-time notifications for users
- Types: `claim`, `message`, `match`, `status`, `system`
- Helper function: `get_unread_notification_count()`

**Usage:**
```typescript
// Create notification
await supabase
  .from("notifications")
  .insert({
    user_id: userId,
    type: "claim",
    title: "New Claim Request",
    message: "Someone wants to claim your item",
    link: `/item/${itemId}`
  });

// Get unread count
const { data: count } = await supabase
  .rpc("get_unread_notification_count", { p_user_id: userId });
```

### 5. Smart Matching (`matches` table)
- AI-powered matching between lost and found items
- Confidence score (0.0 to 1.0)
- Match reasons array

**Usage:**
```typescript
// Create match
await supabase
  .from("matches")
  .insert({
    lost_item_id: lostItemId,
    found_item_id: foundItemId,
    confidence_score: 0.85,
    match_reasons: ["Similar title", "Same location", "Same category"],
    status: "pending"
  });
```

## Database Functions

### Helper Functions Available:

1. **`get_or_create_conversation(item_id, user1_id, user2_id)`**
   - Gets existing conversation or creates new one
   - Returns conversation ID

2. **`get_unread_notification_count(user_id)`**
   - Returns count of unread notifications for user

3. **`get_unread_message_count(user_id)`**
   - Returns count of unread messages for user

## Database Views

### `user_dashboard_stats` View

Provides statistics for user dashboard:
- `lost_items_count` - Number of lost items posted
- `found_items_count` - Number of found items posted
- `successful_claims_count` - Number of approved claims
- `unread_messages_count` - Number of unread messages
- `unread_notifications_count` - Number of unread notifications

**Usage:**
```typescript
const { data } = await supabase
  .from("user_dashboard_stats")
  .select("*")
  .eq("user_id", userId)
  .single();
```

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Profiles**: Anyone can view, users can update own profile
- **Claims**: Anyone can view, users can create/update own claims
- **Conversations**: Users can only see conversations they're part of
- **Messages**: Users can only see messages in their conversations
- **Notifications**: Users can only see their own notifications
- **Matches**: Anyone can view matches

## Automatic Triggers

1. **Auto-create Profile**: When a user signs up, a profile is automatically created
2. **Update `updated_at`**: Automatically updates timestamp on profile and claims updates
3. **Update Conversation Last Message**: Updates `last_message_at` when new message is created
4. **Update Item Claim Status**: Updates item `claim_status` when claim status changes

## Next Steps

After running the SQL schema:

1. **Test Profile Creation**: Sign up a new user and verify profile is created
2. **Test Claims**: Create a claim on an item
3. **Test Messaging**: Start a conversation between two users
4. **Test Notifications**: Create a notification for a user
5. **Test Matching**: Create a match between lost and found items

## Troubleshooting

### Error: "relation already exists"
- Some tables might already exist
- The script uses `DROP TABLE IF EXISTS` to handle this
- If you get errors, you can manually drop tables first

### Error: "permission denied"
- Make sure you're running the SQL as the database owner
- Check that RLS policies are correctly set up

### Profile Not Auto-Created
- Check that the trigger `on_auth_user_created` exists
- Verify the function `handle_new_user()` exists
- Check Supabase logs for errors

## Support

If you encounter any issues:
1. Check Supabase logs in the Dashboard
2. Verify all tables were created successfully
3. Check RLS policies are enabled
4. Verify triggers are working

---

**Last Updated**: 2024
**Version**: 1.0

