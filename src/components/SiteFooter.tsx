import { Flame, MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function SiteFooter() {
  const { settings } = useSiteSettings();

  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <Flame className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">{settings.brand_name}</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">{settings.about_text}</p>
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
          <h4 className="font-semibold text-sm mb-3">Kontak & Lokasi</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              {settings.google_maps_url ? (
                <a href={settings.google_maps_url} target="_blank" rel="noreferrer" className="hover:text-primary">{settings.address}</a>
              ) : (
                <span>{settings.address}</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
              <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:text-primary">{settings.whatsapp}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
              <a href={`mailto:${settings.email}`} className="hover:text-primary">{settings.email}</a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Buka: {settings.open_hours}</span>
            </li>
            {settings.instagram && (
              <li className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-primary flex-shrink-0" />
                <a href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="hover:text-primary">@{settings.instagram.replace(/^@/, "")}</a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {settings.brand_name}. Pedasnya juara.
      </div>
    </footer>
  );
}
