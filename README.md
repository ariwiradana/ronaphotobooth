# Rona Management V1 — PostgreSQL Shared Workspace

Rona Photobooth Bali management app built with Next.js, TypeScript, Drizzle ORM, and PostgreSQL. Two partner accounts have equal access and use the same PostgreSQL-backed workspace.

## What's connected in this build
- Login uses PostgreSQL user records and bcrypt password hashes.
- Profile name and password changes are saved to PostgreSQL.
- Booking, cash transactions, reimbursements, assets, and partner display names load/save through `/api/workspace` to PostgreSQL, so partners/devices use the same persisted dataset. The cash UI exposes exactly one account: `Kas Rona`.
- All operational modules currently persist together in a `workspace_state` JSONB row. This is a practical first persistence layer that makes the app shared and database-backed. It is not yet a normalized ledger with individual SQL tables per booking/transaction/reimbursement; that is the next step before audit-heavy/production accounting use.
- Changes save automatically after a short debounce. Another partner may need to refresh the page to load the latest changes; live push synchronization is not implemented yet.

## Financial rules kept
1. Items purchased for Rona are Rona-owned assets, even if a partner paid personally.
2. A personally paid purchase creates a reimbursement liability linked to the paying partner.
3. Paying a reimbursement reduces cash and the liability; it must not record the original purchase a second time.
4. Partner login accounts are the source of truth for partner names. Edit a partner's name via Profile; don't create duplicate partner records in the workspace.

## Step-by-step setup (Windows / VS Code)

### 1. Install tools
- Install Node.js 20 LTS or newer.
- Install Git (optional but recommended).
- Open this folder in VS Code.

### 2. Create a PostgreSQL database
Choose one:
- **Neon:** create a project/database in the Neon dashboard and copy its PostgreSQL connection string.
- **Supabase:** create a project, open database connection settings, and copy the PostgreSQL URI.
- **Local PostgreSQL:** create a database named `rona_management` and copy the local connection URI.

Use the direct/server connection URI when possible. For hosted providers, include SSL parameters if the provider specifies them.

### 3. Configure environment
- Copy `.env.example` to `.env` in the project root.
- Set `DATABASE_URL` to the PostgreSQL URI.
- Set `SESSION_SECRET` to a random secret of at least 32 characters. Example generation with Node: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Set `PARTNER1_EMAIL`, `PARTNER1_PASSWORD`, `PARTNER2_EMAIL`, and `PARTNER2_PASSWORD`. Use unique passwords of at least 12 characters. Replace all example values.
- Never commit `.env` to Git or send it in screenshots.

### 4. Install dependencies
In the VS Code terminal, from the project root:
```bash
npm install
```

### 5. Create/update the database tables
```bash
npm run db:generate
npm run db:migrate
```
These commands create the tables described by Drizzle, including `users` and `workspace_state`.

### 6. Consolidate cash accounts to one account
If you already ran the earlier version and have `Bank Rona` or `E-wallet Rona` records, run this once after the database migrations:
```bash
npm run db:single-cash
```
It merges opening balances, moves foreign-key references in cash transactions/expenses/other income to the canonical account ID `1`, removes duplicate account rows, and changes historical transaction labels in the shared JSONB workspace to `Kas Rona`. The script runs in a database transaction. Back up the database before running it.

For a brand-new database, you can still run this command; it creates the single `Kas Rona` account.

### 7. Create the two partner logins
```bash
npm run db:seed-users
```
The command creates both partner accounts, or updates their name/password if those email addresses already exist.

### 8. Run the app
```bash
npm run dev
```
Open `http://localhost:3000/login` and sign in with one of the two accounts configured in `.env`.

### 9. Verify shared database persistence
1. Log in on browser/device A and create a test booking.
2. Check the terminal for API/database errors and confirm the sync indicator says “Tersinkron ke PostgreSQL”.
3. Log in on browser/device B and refresh the dashboard. The same booking should appear.
4. Delete the test booking after verification.

### 10. Production deployment
Deploy to a Node-compatible host (for example, Vercel) and set the same environment variables in its project settings. Use HTTPS and a managed PostgreSQL provider. Run database migrations as part of deployment/release, not on every request.

## Important current limitations
- The UI uses a shared JSONB workspace record instead of normalized tables for every module. This provides persistent shared storage, but concurrent edits made at exactly the same time can overwrite each other (last write wins).
- Updates are not pushed live to another browser; refresh to load changes made by the other partner.
- There is no detailed audit log yet.
- Receipt uploads, scheduled backups, conflict resolution, and financial reconciliation are not implemented.
- The current UI is an operational MVP, not certified accounting software. Test with sample data before entering historical/real financial records.

## Session redirect
- Halaman selain `/login` memerlukan session JWT valid.
- Session hilang/kedaluwarsa: redirect ke `/login?next=...`.
- Endpoint API tanpa session: HTTP 401.
- UI menangani respons 401 dengan redirect ke `/login`.
- Session yang masih valid dan membuka `/login` akan diarahkan ke dashboard.
- Setelah login, kembali ke path `next` yang aman (path internal saja).


## Transaksi dengan checkbox inventaris
Pada form **Kas & Transaksi**, centang **Catat sebagai inventaris** jika transaksi pengeluaran adalah pembelian barang milik Rona. Sistem akan membuat catatan inventaris secara otomatis. Jika pembayar adalah salah satu partner (bukan Kas bisnis), sistem juga membuat kewajiban reimburse kepada partner tersebut dan transaksi pembelian ditandai tidak mengurangi saldo kas sampai reimburse dibayarkan. Jika pembayar adalah Kas bisnis, pengeluaran mengurangi saldo Kas Rona dan tidak membuat reimburse. Jangan centang untuk biaya non-aset seperti transportasi atau konsumsi.


## CRUD update (2026-10)
- Booking: edit, ubah status, hapus.
- Kas & transaksi: edit dan hapus transaksi yang tidak terhubung ke aset/reimburse. Transaksi terkait sengaja dibatasi agar penghapusan tidak merusak hubungan pembelian aset dan kewajiban.
- Reimburse dan inventaris: hapus tersedia; edit penuh masih perlu ditambahkan untuk menjaga relasi transaksi pembayaran dan reimburse.
- Data workspace disimpan sebagai JSONB melalui `/api/workspace`; perubahan disinkronkan ke PostgreSQL.


## CRUD table actions
- Booking: edit data, ubah status, dan hapus.
- Kas & Transaksi: edit dan hapus; transaksi terkait aset/reimburse akan menghapus/memperbarui relasi terkait agar total tetap konsisten.
- Reimburse: edit keterangan, nominal (tidak boleh di bawah jumlah yang sudah dibayar), partner, tanggal, jenis; hapus tersedia.
- Inventaris: edit nama, kategori, harga, tanggal, kondisi, lokasi; data reimburse/pembelian terkait ikut diperbarui. Hapus tersedia.
- Penghapusan permanen perlu konfirmasi. Gunakan hanya untuk koreksi data yang salah.
