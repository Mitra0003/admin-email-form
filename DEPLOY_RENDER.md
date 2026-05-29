# Deploy Permanen ke Render

App sudah siap deploy sebagai Node.js web service.

## 1. Upload ke GitHub

Buat repository baru, lalu push folder project ini. File `.env` tidak ikut karena sudah masuk `.gitignore`.

## 2. Buat Service di Render

Pilihan paling cepat:

1. Buka Render Dashboard.
2. Pilih **New +** lalu **Blueprint**.
3. Hubungkan repository GitHub.
4. Render akan membaca `render.yaml`.
5. Isi secret yang diminta.

Alternatif manual:

- Runtime: Node
- Root Directory: `admin-email-form`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

## 3. Environment Variables

Isi di Render Dashboard:

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

Jangan unggah `.env` ke GitHub. Masukkan `SMTP_PASS` dan `ADMIN_ACCESS_TOKEN` hanya di dashboard hosting.

## 4. Setelah Deploy

Cek URL dari Render:

- `/` untuk form user.
- `/api/health` harus menghasilkan `{"ok":true}`.
- `/api/admin/health` hanya bisa dibuka dengan header `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`.
