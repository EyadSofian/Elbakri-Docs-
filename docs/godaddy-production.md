# GoDaddy Production Deployment

This project is designed to run on GoDaddy cPanel with:

- React frontend
- PHP API under `/api`
- MySQL database

## 1. Create the MySQL Database

In GoDaddy:

1. Open the hosting dashboard.
2. Click **cPanel Admin**.
3. Open **MySQL Database Wizard**.
4. Create a database, for example `elbakri_docs`.
5. Create a database user.
6. Give the user **All Privileges** on the database.
7. Save these values:
   - database host, usually `localhost`
   - database name, usually like `cpaneluser_elbakri_docs`
   - database username, usually like `cpaneluser_elbakri_user`
   - password

## 2. Upload API Files

Upload the contents of `public/api` to the website API folder:

```text
public_html/api
```

For an addon domain, use that domain's document root instead of `public_html`.

On the server:

1. Copy `config.example.php`.
2. Rename the copy to `config.php`.
3. Edit `config.php` and fill in `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASS`.

The API automatically creates the table it needs. You can also run `schema.sql` manually from phpMyAdmin.

## 3. Security

Do not leave the app publicly open if it contains real client or financial data.

Recommended cPanel setup:

1. Use **Directory Privacy** on the app folder.
2. Create a username/password for staff.
3. Use HTTPS.
4. Keep `config.php` on the server only. Do not commit it to GitHub.

`ELBAKRI_API_TOKEN` is only a lightweight gate. If you put a matching `VITE_API_TOKEN` in the frontend, it is visible in browser files, so it is not a replacement for real access control.

## 4. Frontend API URL

By default, the frontend calls:

```text
/api
```

If the API is hosted elsewhere, create `.env` before building:

```bash
VITE_API_BASE=https://example.com/api
```

## 5. Data Migration

The app still reads old browser `localStorage` data as a fallback.

On first run, if the MySQL collection is empty and the browser has existing local data, the app uploads that collection to MySQL automatically. Do this once from the browser that has the correct existing data.

## 6. Multiple Websites on One GoDaddy Plan

For each website:

- Add the domain or subdomain in GoDaddy/cPanel.
- Use a separate document root.
- Use a separate MySQL database or at least a separate table prefix.
- Keep each app's `config.php` separate.

For Elbakri Portal, Elbakri B2C, and this Docs app, the clean setup is:

```text
portal.example.com     -> /portal
b2c.example.com        -> /b2c
docs.example.com       -> /docs
docs.example.com/api   -> /docs/api
```

Each app should have its own database unless they intentionally share data.
