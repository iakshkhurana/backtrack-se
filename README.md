# BackTrack Campus Find

An intelligent lost & found management system built with React and Supabase that leverages AI to automate item discovery, voice-based posting, and smart matching between lost and found items.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-akshkhurana.store-blue)](https://akshkhurana.store)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black)](https://github.com/iakshkhurana/backtrack-se)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-YouTube-red)](https://youtu.be/7kxbCZLdLis)

[View Live Demo](https://akshkhurana.store) | [Watch Demo Video](https://youtu.be/7kxbCZLdLis)

## Tech Stack

**Frontend:** React • TypeScript • Vite • Tailwind CSS

**Backend:** Supabase (PostgreSQL • Authentication • Storage • Real-time)

**AI Services:** OpenRouter API (GPT-4o-mini) • Web Speech API

## Overview

BackTrack Campus Find simplifies the process of reuniting students with their lost belongings by eliminating manual searching and providing intelligent matching through AI-powered features. Users can post lost/found items, search using natural language, upload photos for automatic analysis, and use voice commands—all powered by modern web technologies and AI.

**📹 [Watch Demo Video](https://youtu.be/7kxbCZLdLis)** - See BackTrack in action!

## Key Features

**Secure Authentication** - Supabase Auth with email/password and Google OAuth support

**AI-Powered Search** - Natural language search with intelligent keyword extraction using OpenRouter API (GPT-4o-mini)

**Voice-Enabled Item Posting** - Hands-free item posting with speech-to-text and AI-powered form filling via Web Speech API and OpenRouter

**Smart Item Management** - Create, edit, delete items with automatic categorization (Phone, Keys, Stationery, Electronics, Wallet, Clothing, Other)

**AI Image Analysis** - Upload photos and automatically extract item details (title, description, category) using Vision AI

**AI Chat Assistant** - Interactive chatbot for finding items using conversational queries with access to real item data

**Item Claiming System** - Submit claims for found items with verification details and status tracking

**Advanced Filtering** - Filter items by category, search by keywords, and sort by date with automatic claimed items sorting

**Real-time Updates** - Live updates for new items using Supabase real-time subscriptions

**Modern UI/UX** - Beautiful, responsive interface with dark mode, smooth animations, and mobile-first design

**Admin Panel** - Comprehensive admin dashboard for managing items, claims, and user roles

## Tech Stack

### Frontend

**Framework:** React 18 with TypeScript

**Build Tool:** Vite 5

**State Management:** React Hooks, React Query (TanStack Query)

**UI Library:** Radix UI components with Tailwind CSS 4

**Forms:** React Hook Form with Zod validation

**Routing:** React Router DOM v6

**Animations:** Framer Motion

**Charts:** Recharts (for admin analytics)

**Voice:** Web Speech API (browser-native)

**Styling:** Tailwind CSS with custom animations and shadcn/ui components

### Backend

**Platform:** Supabase (Backend-as-a-Service)

**Database:** PostgreSQL (via Supabase)

**Authentication:** Supabase Auth (JWT-based with OAuth)

**File Storage:** Supabase Storage

**Real-time:** Supabase Realtime subscriptions

**AI Services:**
- OpenRouter API (GPT-4o-mini) for AI chat, voice parsing, and image analysis
- Web Speech API for browser-native speech recognition

**Validation:** Zod schemas

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or bun
- Supabase account
- OpenRouter API key (for AI features)

### Installation

Clone the repository

```bash
git clone https://github.com/iakshkhurana/backtrack-se.git
cd backtrack-se
```

Install dependencies

```bash
npm install
# or
yarn install
# or
bun install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# AI Services (OpenRouter)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

**Getting Your Keys:**

1. **Supabase:**
   - Create a project at [supabase.com](https://supabase.com)
   - Go to Project Settings → API
   - Copy the Project URL and anon/public key

2. **OpenRouter:**
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Get your API key from the dashboard
   - Add credits to your account (required for API usage)

### Database Setup

1. **Run SQL Schema:**
   - Go to your Supabase project SQL Editor
   - Run the schema files from `DOCUMENTATION/` folder:
     - `Complete-SQL-Schema.sql` (base schema)
     - `High-Priority-Features-Schema.sql` (extended features)

2. **Enable Storage:**
   - Go to Storage in Supabase dashboard
   - Create a bucket named `item-images`
   - Set it to public for image access

3. **Configure Authentication:**
   - Enable Email/Password authentication
   - Enable Google OAuth (optional)
   - Add redirect URLs in Authentication settings

### Running the Application

Start Development Server

```bash
npm run dev
# or
yarn dev
# or
bun run dev
```

Application will be available at `http://localhost:8080`

Build for Production

```bash
npm run build
# or
yarn build
# or
bun run build
```

Preview Production Build

```bash
npm run preview
# or
yarn preview
# or
bun preview
```

## Project Structure

```
backtrack-se/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── AIChat.tsx      # AI chat assistant
│   │   ├── VoiceAssistant.tsx  # Voice posting assistant
│   │   └── ItemCard.tsx    # Item display card
│   ├── pages/              # Page components
│   │   ├── Index.tsx       # Landing page
│   │   ├── Lost.tsx        # Lost items page
│   │   ├── Found.tsx       # Found items page
│   │   ├── PostItem.tsx    # Post item form
│   │   ├── Profile.tsx     # User profile
│   │   └── Admin.tsx       # Admin dashboard
│   ├── services/           # API services
│   │   ├── openrouter.ts   # OpenRouter API client
│   │   └── speech-to-text.ts # Speech recognition
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/       # Supabase client & types
│   └── lib/                # Utilities
├── public/                 # Static assets
├── DOCUMENTATION/          # Setup guides and docs
└── package.json           # Dependencies
```

## Key Features in Detail

### AI-Powered Search

- **Natural Language Processing:** Search using everyday language (e.g., "I lost my blue iPhone near the library")
- **Keyword Extraction:** Automatically extracts relevant keywords from queries
- **Smart Matching:** Finds items based on description, category, and location
- **Contextual Results:** Returns results ranked by relevance

### Voice Assistant

- **Interactive Q&A:** The assistant asks questions about your item
- **Automatic Form Filling:** Details are automatically extracted and filled in
- **Speech Recognition:** Works with browser's native Web Speech API
- **Text Fallback:** Manual text input available if voice isn't supported

### Image Analysis

- **Automatic Detection:** Identifies item type, color, and features using Vision AI
- **Detail Extraction:** Extracts title, description, and category from images
- **One-Click Fill:** Automatically fills the form with extracted information

### Item Claiming System

- **Verification Details:** Submit claims with ownership verification
- **Status Tracking:** Track claim status (pending, approved, rejected, claimed)
- **Owner Notifications:** Automatic notifications when items are claimed
- **Admin Review:** Admin panel for reviewing and approving claims

### Smart Sorting

- **Automatic Organization:** Claimed items automatically sorted to the end
- **Date Sorting:** Items sorted by date reported (newest first)
- **Category Filtering:** Filter by 7 different categories
- **Search Integration:** Real-time search across all item fields

## API Integration

### Supabase API

**Authentication:**
- `supabase.auth.signUp()` - User registration
- `supabase.auth.signInWithPassword()` - Email/password login
- `supabase.auth.signInWithOAuth()` - Google OAuth
- `supabase.auth.signOut()` - User logout

**Database:**
- `supabase.from('items').select()` - Get items
- `supabase.from('items').insert()` - Create item
- `supabase.from('items').update()` - Update item
- `supabase.from('items').delete()` - Delete item
- `supabase.from('claims').insert()` - Submit claim

**Storage:**
- `supabase.storage.from('item-images').upload()` - Upload images
- `supabase.storage.from('item-images').getPublicUrl()` - Get image URL

### OpenRouter API

**AI Chat:**
- POST to OpenRouter API with user query
- Returns intelligent keyword extraction and search suggestions

**Voice Parsing:**
- POST transcribed voice text to OpenRouter
- Returns structured item data (title, description, category, location)

**Image Analysis:**
- POST image to OpenRouter with Vision model
- Returns extracted item details from image

## Deployment

### Frontend

**Platform:** Vercel (recommended) or Netlify

**Live URL:** [akshkhurana.store](https://akshkhurana.store)

**Deployment Steps:**

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_OPENROUTER_API_KEY`
4. Deploy

### Environment Setup for Production

Make sure to set all environment variables in your deployment platform's environment settings. Never commit `.env` files to version control.

## Documentation

- [AI Features Documentation](./DOCUMENTATION/AI-Features-Documentation.md)
- [Supabase Setup Guide](./DOCUMENTATION/Supabase-Setup-Guide.md)
- [Voice Assistant Setup](./DOCUMENTATION/Voice-Assistant-Setup.md)
- [OAuth Setup](./DOCUMENTATION/OAuth-Setup.md)
- [High Priority Features Setup](./DOCUMENTATION/High-Priority-Features-Setup.md)

## Project Status

✅ **Completed Features:**

- Authentication & User Management (Email/Password + Google OAuth)
- Item Posting (Lost/Found with images)
- AI-Powered Search & Chat
- Voice-Enabled Item Posting
- Image Analysis with AI
- Item Claiming System
- Advanced Filtering & Sorting
- Admin Panel
- Real-time Updates
- Dark Mode
- Responsive Design
- Profile Management

🔄 **In Progress:**

- Enhanced matching algorithms
- Push notifications
- Email notifications for claims

📋 **Planned Features:**

- Mobile app (React Native)
- SMS notifications
- Advanced analytics dashboard
- Item recommendations

## Browser Compatibility

- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Opera

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is developed as part of academic coursework.

---

**Built with ❤️ by Aksh**

*BackTrack Campus Find - Reuniting students with their belongings, one item at a time.*
