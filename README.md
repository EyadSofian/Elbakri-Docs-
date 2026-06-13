# Elbakri Docs

Internal document studio for Elbakri Overseas. The app creates and manages:

- Invoices
- Vouchers
- Statements of account
- Client and supplier records
- Service templates
- Client account payments, notes, refunds, and adjustments
- Bulk invoice export

## Tech Stack

- React 19
- TanStack Router / TanStack Start
- Vite
- Tailwind CSS
- shadcn-style UI components
- Browser `localStorage` persistence

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The current build outputs TanStack Start SSR assets to `dist/client` and `dist/server`.

## Deployment Notes

This project currently stores data in the browser using `localStorage`.

That means:

- No shared database is used yet.
- Data is saved per browser/device.
- Clearing browser storage can remove app data.
- Multiple staff members will not automatically share the same records.

For a production multi-user deployment, add a real backend database first, such as:

- MySQL/PHP API on cPanel hosting
- Supabase/Postgres
- A Node.js backend on VPS/Web Hosting Plus

Standard GoDaddy cPanel hosting can host static files and PHP/MySQL apps. The current TanStack Start SSR build needs a server runtime unless the app is converted to a static Vite SPA build.
