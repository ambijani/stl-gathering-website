# STL Gathering Website

Community gathering management platform for the STL Ismaili community. Tracks Varo assignments, shoe counts, and member signups across Friday and Chandraat gatherings.

## Features

**Public**
- Member signup form with Varo interest selection and WhatsApp community redirect

**Admin**
- People management — add, edit, merge, and remove members
- Gatherings — create events (Friday, Chandraat, Kushali, Eid, Taliqah), assign Varos per person, track shoe counts
- Varo assignment via modal or matrix view
- Analytics — average shoe count by month, shoe count per date, Varo frequency by person
- HMAC-SHA256 session auth with rate-limited login

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB / Mongoose
- **Styling**: Tailwind CSS v4
- **Auth**: HMAC-SHA256 signed session tokens (Web Crypto API)
- **Deployment**: Vercel

## Environment Variables

```
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key
ADMIN_PASSWORD=your_admin_password
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Import

To import from a Google Sheets export (`data.xlsx`):

```bash
npx tsx scripts/import-from-excel.ts
```

The spreadsheet should have sheets: `Varo Form Responses`, `Schedule`, `Shoe Count`.

After re-importing, run the cleanup script to remove any orphaned combined-name records:

```bash
npx tsx scripts/cleanup-combined-names.ts
```
