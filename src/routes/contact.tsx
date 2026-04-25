import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock, Instagram, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Kontak & Lokasi — Juragan Geprek" },
      { name: "description", content: "Hubungi Juragan Geprek lewat WhatsApp atau email, lihat alamat outlet, jam buka, dan peta lokasi." },
      { property: "og:title", content: "Kontak & Lokasi — Juragan Geprek" },
      { property: "og:description", content: "Alamat, jam buka, WhatsApp, dan lokasi outlet Juragan Geprek." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { settings } = useSiteSettings();
  const waNumber = settings.whatsapp.replace(/\D/g, "").replace(/^0/, "62");
  const igUser = settings.instagram?.replace(/^@/, "");

  // Build maps embed URL: if user pasted an embed URL keep it, otherwise use a search embed of the address
  const mapsEmbedSrc =
    settings.google_maps_url && settings.google_maps_url.includes("/embed")
      ? settings.google_maps_url
      : `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl">
        <div className="text-sm font-semibold text-primary uppercase tracking-wider">Kontak & Lokasi</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-2">Sapa kami, mampir, atau pesan langsung</h1>
        <p className="mt-3 text-muted-foreground">
          Tim {settings.brand_name} siap membantu pertanyaan menu, pemesanan catering, dan pengiriman.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Info */}
        <div className="space-y-4">
          <ContactCard icon={MapPin} title="Alamat Outlet">
            <p className="text-sm">{settings.address}</p>
            {settings.google_maps_url && (
              <a href={settings.google_maps_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
                Buka di Google Maps →
              </a>
            )}
          </ContactCard>

          <ContactCard icon={Clock} title="Jam Buka">
            <p className="text-sm">{settings.open_hours}</p>
          </ContactCard>

          <ContactCard icon={Phone} title="WhatsApp">
            <p className="text-sm">{settings.whatsapp}</p>
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="mt-3 inline-block">
              <Button size="sm" className="bg-[#25D366] text-white hover:bg-[#1ebe57]">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat WhatsApp
              </Button>
            </a>
          </ContactCard>

          <ContactCard icon={Mail} title="Email">
            <a href={`mailto:${settings.email}`} className="text-sm text-primary hover:underline">{settings.email}</a>
          </ContactCard>

          {igUser && (
            <ContactCard icon={Instagram} title="Instagram">
              <a href={`https://instagram.com/${igUser}`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                @{igUser}
              </a>
            </ContactCard>
          )}
        </div>

        {/* Map */}
        <div className="rounded-2xl border border-border/60 bg-card p-2 shadow-card overflow-hidden">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
            <iframe
              title={`Lokasi ${settings.brand_name}`}
              src={mapsEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
              allowFullScreen
            />
          </div>
          <div className="px-4 py-3 text-xs text-muted-foreground">
            Peta menampilkan lokasi berdasarkan alamat di Pengaturan Situs.
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero shadow-warm">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <h3 className="font-display text-lg font-bold">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
