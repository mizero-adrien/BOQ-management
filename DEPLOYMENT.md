# Deployment Guide

## Prerequisites

- Vercel account
- Supabase project with all tables and RLS configured
- `plan-images` storage bucket (public read)

## Environment Variables

Set these in Vercel project settings under Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Vercel Deployment

1. Push the repository to GitHub
2. Import the repository in Vercel
3. Framework preset: Next.js (auto-detected)
4. Add the two environment variables above
5. Deploy

## Database Setup

Run these SQL files in the Supabase SQL editor in order:

1. `database/budget_alert_trigger.sql` — creates the trigger that fires budget alert notifications when a BOQ item reaches 80% usage
2. `database/report_reminder_function.sql` — creates the `send_report_reminders()` function

### Scheduling report reminders

The `send_report_reminders()` function must be called on a schedule (e.g. daily at 14:00 Kigali time). Options:

- Supabase Edge Functions with pg_cron:
  ```sql
  select cron.schedule('report-reminders', '0 12 * * *', 'select send_report_reminders()');
  ```
- External cron job that calls a Supabase Edge Function

## Storage

Create a storage bucket named `plan-images` with the following policy:
- Authenticated users can upload
- Public read access (for sharing floor plans)

## PWA Icons

Run `node scripts/generate-icons.js` to generate SVG icons in `public/`. Convert to PNG for full browser support:

```
convert public/icon-192.svg public/icon-192.png
convert public/icon-512.svg public/icon-512.png
```

Or use an online SVG-to-PNG converter and place the output in `public/`.
