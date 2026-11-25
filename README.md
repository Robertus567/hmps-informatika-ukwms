# HMPS Informatika UKWMS — Website & Member Announcement

Website Himpunan Mahasiswa Program Studi Informatika, Universitas Katolik Widya Mandala Surabaya, sekaligus halaman pengumuman hasil wawancara anggota baru.

- **Beranda** (`/`) — tentang himpunan, visi & misi, divisi.
- **Tim Kami** (`/tim`) — daftar pengurus per divisi.
- **Pengumuman** (`/pengumuman`) — countdown, lalu animasi reveal nama yang lolos saat waktunya tiba (tampil sekali per pengunjung).
- **Panel admin** (`/panel-hmpsinf26`) — kelola peserta, tandai yang lolos, atur tanggal & jam pengumuman (WIB), preview, dan uji coba.

## Teknologi

HTML, CSS, dan JavaScript tanpa framework. Backend berupa Vercel Functions di `api/`. Data disimpan di Vercel Blob; Upstash Redis juga didukung bila env `KV_REST_API_URL`/`KV_REST_API_TOKEN` diisi.

Nama yang lolos tidak pernah dikirim ke browser sebelum jam pengumuman tiba.

## Konfigurasi

Login admin dibaca dari environment variable, tidak ada password di dalam kode:

| Variabel | Keterangan |
| --- | --- |
| `ADMIN_USERNAME` | username panel admin (wajib) |
| `ADMIN_PASSWORD` | password panel admin (wajib) |
| `ADMIN_SECRET` | kunci acak untuk menandatangani sesi login (disarankan) |
| `BLOB_READ_WRITE_TOKEN` | diisi otomatis saat Vercel Blob dihubungkan ke proyek |

## Menjalankan lokal

Buat file `.env.dev` (sudah di-ignore git) berisi `ADMIN_USERNAME=...` dan `ADMIN_PASSWORD=...`, lalu:

```bash
node dev-server.mjs   # http://localhost:5173 (data disimpan di ./data)
```

## Deploy

```powershell
.\tools\deploy.ps1
```

Skrip ini deploy dari salinan proyek tanpa `.git`, karena Vercel Hobby menolak deploy jika email penulis commit tidak terdaftar di akun Vercel. Kalau email git kamu sudah ditambahkan ke akun Vercel, `npx vercel@latest deploy --prod` juga bisa dipakai langsung.
