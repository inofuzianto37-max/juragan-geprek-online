import { Flame } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <Flame className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">Juragan Geprek</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Catering geprek otentik untuk acara dan harian. Pedasnya bikin nagih, hangatnya bikin betah.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Layanan</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>Pesan satuan</li>
            <li>Paket catering event</li>
            <li>Pengiriman lokal</li>
            <li>Pickup di tempat</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Kontak</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>WhatsApp: 0812-3456-7890</li>
            <li>Email: hello@juragangeprek.id</li>
            <li>Buka: 09.00 – 22.00 WIB</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Juragan Geprek. Pedasnya juara.
      </div>
    </footer>
  );
}
