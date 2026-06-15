# Project Setup

## Tech stack
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- Supabase (database, auth, storage, realtime)
- PWA with next-pwa and Workbox (Webpack-based build)

## Colours
- Primary navy: #00236F
- Accent periwinkle: #778EDE
- Surface: #F5F6FA
- White: #FFFFFF
- Black: #111111

## Font
- Inter (loaded via next/font/google)

## Environment variables needed
Copy .env.example to .env.local and fill in your Supabase project URL and anon key.

## Folder structure
- src/app/(auth) - login, signup, forgot password
- src/app/(engineer) - engineer mobile screens
- src/app/(pm) - project manager desktop screens
- src/app/share/[token] - public owner dashboard
- src/app/api - all API routes
- src/components - reusable UI components
- src/lib - utilities and Supabase clients
- src/types - TypeScript type definitions
- src/hooks - custom React hooks

## Next steps
1. Create Supabase project at supabase.com
2. Add credentials to .env.local
3. Run the database schema SQL (see database/schema.sql)
4. Build the login screen first
