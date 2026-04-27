// =====================================================================
// SPA build config untuk hosting eksternal (VPS pribadi, Vercel, Netlify, dll).
//
// JANGAN dipakai di Lovable (Lovable pakai vite.config.ts dengan SSR Cloudflare).
//
// Build:  vite build --config vite.config.spa.ts
// Output: folder dist/ berisi index.html + assets siap upload.
// =====================================================================
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";
import fs from "node:fs";

// Plugin: tulis index.html standar SPA dari src/routes/__root.tsx metadata.
// Karena TanStack Start tidak punya entry HTML statis, kita generate sendiri.
function spaIndexHtml() {
  return {
    name: "spa-index-html",
    apply: "build" as const,
    configResolved() {
      const indexPath = path.resolve(process.cwd(), "index.html");
      if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(
          indexPath,
          `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <title>Juragan Geprek — E-Catering</title>
    <meta name="description" content="Pesan ayam geprek dan paket catering Juragan Geprek secara online." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.spa.tsx"></script>
  </body>
</html>
`,
        );
      }
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [
    spaIndexHtml(),
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
