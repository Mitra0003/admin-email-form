# Deploy Permanen ke Netlify Free

App ini disiapkan untuk Netlify sebagai static frontend + Netlify Functions.

## 1. Import dari GitHub

1. Buka Netlify Dashboard.
2. Pilih **Add new site** lalu **Import an existing project**.
3. Pilih repository `Mitra0003/admin-email-form`.
4. Netlify akan membaca `netlify.toml`.

Build settings yang dipakai:

- Base directory: `admin-email-form`
- Build command: `npm run check`
- Publish directory: `public`
- Functions directory: `netlify/functions`

## 2. Environment Variables

Isi di Netlify Dashboard pada **Site configuration** > **Environment variables**:

```env
MAIL_MODE=smtp
ADMIN_EMAIL=mitrasyaputra00@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mitrasyaputra00@gmail.com
SMTP_FROM=Admin Form <mitrasyaputra00@gmail.com>
SMTP_PASS=isi-app-password-gmail
ADMIN_ACCESS_TOKEN=buat-token-panjang-random
```

Jangan unggah `.env` ke GitHub. Masukkan `SMTP_PASS` dan `ADMIN_ACCESS_TOKEN` hanya di dashboard Netlify.

## 3. Setelah Deploy

Cek URL Netlify:

- `/` untuk form user.
- `/api/health` harus menghasilkan `{"ok":true}`.
- `/api/admin/health` hanya bisa dibuka dengan header `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`.
