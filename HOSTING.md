# 🚀 Panduan Hosting: VPS Pribadi + Vercel

Project ini di Lovable berjalan sebagai **SSR di Cloudflare Workers**. Untuk hosting ke **VPS pribadi** dan **Vercel** sekaligus tanpa ribet, kita pakai pendekatan **SPA statis**: satu folder `dist/` yang bisa di-upload ke mana saja.

> ⚠️ **PENTING**: Jangan ubah `vite.config.ts` di dalam Lovable — itu akan merusak preview. Ikuti langkah berikut **setelah** men-clone repo ke komputer/VPS Anda.

---

## 📦 Langkah 1 — Clone repo dari GitHub

1. Connect Lovable → GitHub (Connectors → GitHub → Connect project)
2. Di komputer Anda:
   ```bash
   git clone https://github.com/<user>/<repo>.git
   cd <repo>
   bun install   # atau: npm install
   ```

---

## ⚙️ Langkah 2 — Buat config build SPA terpisah

Buat file **`vite.config.spa.ts`** di root (file ini sudah disertakan, lihat di bawah). Ini mengganti config Lovable saat build untuk hosting eksternal.

Lalu tambahkan script di `package.json`:

```json
{
  "scripts": {
    "build:spa": "vite build --config vite.config.spa.ts"
  }
}
```

---

## 🔐 Langkah 3 — File `.env` di komputer/VPS Anda

Lovable Cloud memberi Anda 2 nilai publik (aman di-bundle):

```env
VITE_SUPABASE_URL=https://pnxlqexffkeitkdgawkr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...   # anon key dari .env Lovable
VITE_SUPABASE_PROJECT_ID=pnxlqexffkeitkdgawkr
```

Salin nilai dari file `.env` di repo (sudah ada).

---

## 🏗️ Langkah 4 — Build

```bash
bun run build:spa
# Hasil: folder dist/ berisi index.html + assets/
```

Folder `dist/` ini **siap di-upload** ke mana saja.

---

## 🌐 Hosting di VPS Pribadi (Nginx)

### A. Static (paling sederhana, recommended)

Upload isi folder `dist/` ke VPS, lalu konfigurasi Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/yourdomain/dist;
    index index.html;

    # SPA fallback — semua route diarahkan ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache assets dengan hash
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Lalu pasang SSL:
```bash
sudo certbot --nginx -d yourdomain.com
```

### B. Pakai serve / pm2 (kalau tidak mau Nginx)

```bash
npm install -g serve pm2
pm2 start "serve -s dist -l 3000" --name geprek
pm2 save && pm2 startup
```

---

## ▲ Hosting di Vercel

1. Push repo ke GitHub
2. Di Vercel → **Add New Project** → import repo
3. Build settings:
   - **Build Command**: `bun run build:spa` (atau `npm run build:spa`)
   - **Output Directory**: `dist`
   - **Install Command**: `bun install` (atau `npm install`)
4. Environment Variables (copy dari `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
5. Deploy.

File `vercel.json` (sudah disertakan) menangani SPA fallback otomatis.

---

## ✅ Yang Tetap Berfungsi di Kedua Hosting

- ✅ Login / Register (Supabase Auth via client SDK)
- ✅ Order, Cart, Menu, Admin Dashboard, Pengaturan
- ✅ Upload bukti bayar (Supabase Storage)
- ✅ RLS, Realtime, semua database query

## ⚠️ Yang Hilang (vs Lovable Preview)

- ❌ SSR meta tag dinamis — semua page punya meta yang sama saat first load (tidak masalah untuk app private/dashboard, hanya kurang ideal untuk SEO)
- ❌ TanStack server functions (project ini tidak menggunakannya, jadi tidak ada dampak)

---

## 🔄 Workflow Sehari-hari

1. **Develop di Lovable** seperti biasa → otomatis push ke GitHub
2. **Vercel** auto-deploy dari GitHub setiap push
3. **VPS pribadi** — pull & rebuild:
   ```bash
   cd /var/www/yourdomain
   git pull
   bun install && bun run build:spa
   # Selesai, file di dist/ langsung dipakai Nginx
   ```

   Atau pakai GitHub Actions untuk auto-deploy ke VPS via SSH.

---

## 🆘 Troubleshooting

| Masalah | Solusi |
|---|---|
| 404 saat refresh halaman | Pastikan SPA fallback Nginx (`try_files ... /index.html`) atau `vercel.json` ada |
| Page kosong / blank | Cek browser console — biasanya env var tidak terbaca. Pastikan prefix `VITE_` dan rebuild |
| Login tidak persist | Normal — pakai localStorage; pastikan domain tidak berubah-ubah |
| CORS error ke Supabase | Tambahkan domain VPS/Vercel di Supabase → Auth → URL Configuration |
