# Admin Email Form

Web form bersih untuk menerima nama dan alamat user, lalu mengirimkannya ke email admin melalui backend.

## Menjalankan

```powershell
cd admin-email-form
npm start
```

Buka `http://localhost:18200`.

## Deploy

Untuk deploy permanen, lihat `../DEPLOY_RENDER.md`.

## Mengirim Email Sungguhan

1. Pastikan `.env` berisi `MAIL_MODE=smtp` dan `ADMIN_EMAIL=mitrasyaputra00@gmail.com`.
2. Isi `SMTP_USER`, `SMTP_PASS`, dan `SMTP_FROM` dengan akun pengirim. Untuk Gmail, gunakan App Password 16 karakter, bukan password login biasa. Jika App Password ditempel dengan spasi, backend akan menghapus spasinya otomatis.
3. Install dependency email:

```powershell
npm install
```

4. Jalankan:

```powershell
npm start
```

Tanpa `.env`, app berjalan dalam mode `preview`: endpoint tetap menerima dan memvalidasi data, tetapi tidak mengirim email keluar. Password SMTP tidak boleh ditulis ke frontend.

## Keamanan Admin

- Endpoint publik `/api/health` hanya menampilkan status umum.
- Detail konfigurasi dan aktivitas hanya tersedia di `/api/admin/health` dengan header `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`.
- Token admin disimpan di `.env` sebagai `ADMIN_ACCESS_TOKEN` dan jangan ditaruh di frontend.
- Endpoint submit memiliki rate limit sederhana untuk mengurangi spam.
