# STL Gathering Website

Community gathering management platform for the STL Ismaili community. Tracks Varo assignments, shoe counts, and member signups across Friday and Chandraat gatherings.

## Why This Exists

Before this, Varo assignments, shoe counts, and member signups were tracked by hand in spreadsheets and WhatsApp messages — easy to lose track of who'd already served a Varo, hard to spot patterns, and tedious to keep up to date. This app replaces that manual process with one place to record gatherings as they happen and look back on history (who's assigned, how often, attendance trends) without digging through old sheets.

It's purpose-built for how this specific community runs its gatherings (its Varo rotation, its event types, its admins), not a general-purpose tool meant for others to adopt. This README exists so anyone picking up the code — maintaining it, or just trying to understand a decision in it — knows what problem it's solving and why it's shaped the way it is, not as a guide for recreating it elsewhere.

## Features

**Public**
- Member signup form with Varo interest selection and WhatsApp community redirect

**Admin**
- People management — add, edit, merge, and remove members
- Gatherings — create events (Friday, Chandraat, Kushali, Eid, Taliqah), assign Varos per person, track shoe counts
- Varo assignment via a per-Varo modal, with recent assignment history
- Analytics — average shoe count by month, shoe count per date, Varo frequency by person
- HMAC-SHA256 session auth with rate-limited login

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB / Mongoose
- **Styling**: Tailwind CSS v4
- **Auth**: HMAC-SHA256 signed session tokens (Web Crypto API)
- **Deployment**: Vercel
