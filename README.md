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

**Demo Mode**
- Read-only access to the full admin panel without a password — useful for sharing as a portfolio piece or showing the UI to others
- Activated via the "Try Demo" button on the login page, which issues a signed demo session token (2-hour expiry)
- All write operations (POST, PUT, DELETE) are blocked at the middleware layer and return `403 Demo mode: this action is disabled`
- Member names and sensitive fields are visually blurred client-side via a `BlurredName` component to protect real community data
- Phone numbers and other PII are redacted server-side — API routes check the `x-demo-mode` header (forwarded by middleware) and omit sensitive fields from responses
- Demo sessions are cryptographically distinct from real admin sessions (`isDemoToken` check in `middleware.ts`) so they can never be escalated to write access

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
