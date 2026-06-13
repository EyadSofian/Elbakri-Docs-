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
- MySQL-backed PHP API persistence, with browser `localStorage` fallback for development

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

The app now includes a PHP/MySQL API in `public/api` for shared production data.

Production setup summary:

1. Create a MySQL database and user in cPanel.
2. Upload the API files from `public/api` to `/api` on the website.
3. Copy `config.example.php` to `config.php` on the server.
4. Fill `config.php` with the cPanel database credentials.
5. Protect the app/API with cPanel Directory Privacy or another login layer before using it publicly.

See `docs/godaddy-production.md` for the full deployment checklist.
