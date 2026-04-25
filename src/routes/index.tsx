import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame, Truck, Store, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MenuCard, type MenuItemRow } from "@/components/MenuCard";
import heroImg from "@/assets/hero-geprek.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Juragan Geprek — Catering Geprek Online" },
      { name: "description", content: "Pesan ayam geprek otentik & paket catering event. Pedasnya juara, hangatnya bikin betah." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: featured } = useQuery({
    queryKey: ["featured-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .eq("is_catering_package", false)
        .gt("stock", 0)
        .limit(6);
      if (error) throw error;
      return data as MenuItemRow[];
    },
  });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-warm">
        <div className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-2 md:py-24 md:gap-6 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <Flame className="h-3 w-3" /> Pedasnya Bikin Nagih
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-balance">
              Geprek <span className="text-primary">Hangat</span>,<br />
              Catering <span className="text-primary">Juara</span>.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground text-balance">
              Dari porsi satuan untuk makan siang sampai paket catering ratusan porsi untuk acaramu — semua diolah segar setiap hari.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-hero text-primary-foreground shadow-warm hover:opacity-90">
                <Link to="/menu">Pesan Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30 text-foreground hover:bg-primary/5">
                <Link to="/catering">Lihat Paket Catering</Link>
              </Button>
            </div>
            <div className="flex items-center gap-1 pt-2 text-sm text-muted-foreground">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
              <span className="ml-2">Dipercaya 1,200+ pelanggan setia</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-hero opacity-20 blur-3xl rounded-full" />
            <img
              src={heroImg}
              alt="Ayam geprek crispy dengan sambal khas Juragan Geprek"
              width={1536}
              height={1024}
              className="relative rounded-3xl shadow-warm aspect-[4/3] object-cover"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Flame, title: "Sambal Khas", desc: "Resep sambal turun-temurun yang bikin lidah dansa." },
            { icon: Truck, title: "Antar Lokal", desc: "Pengiriman cepat di area kota. Atau pickup gratis." },
            { icon: Users, title: "Catering Event", desc: "Paket 25, 50, hingga 100+ porsi untuk acaramu." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero shadow-warm">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED MENU */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-sm font-semibold text-primary uppercase tracking-wider">Menu Andalan</div>
            <h2 className="font-display text-4xl font-bold mt-1">Pilih Geprekmu</h2>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/menu">Lihat semua <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured?.map((m) => <MenuCard key={m.id} item={m} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 md:p-16 shadow-warm">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] items-center">
            <div className="text-primary-foreground">
              <h2 className="font-display text-4xl md:text-5xl font-bold">Punya event spesial?</h2>
              <p className="mt-2 text-primary-foreground/90 max-w-lg">Catering geprek 25–100+ porsi siap diantar atau di-pickup. Cocok untuk arisan, kantor, dan syukuran.</p>
            </div>
            <Button asChild size="lg" className="bg-background text-primary hover:bg-background/90">
              <Link to="/catering">Lihat Paket <Store className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
