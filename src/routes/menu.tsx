import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MenuCard, type MenuItemRow } from "@/components/MenuCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Juragan Geprek" },
      { name: "description", content: "Jelajahi menu lengkap ayam geprek, paket hemat, dan minuman segar." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["menu", activeCat],
    queryFn: async () => {
      let q = supabase.from("menu_items").select("*").eq("is_available", true).eq("is_catering_package", false).gt("stock", 0);
      if (activeCat) q = q.eq("category_id", activeCat);
      const { data, error } = await q.order("price");
      if (error) throw error;
      return data as MenuItemRow[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="text-sm font-semibold text-primary uppercase tracking-wider">Katalog</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mt-1">Menu Lengkap</h1>
        <p className="mt-2 text-muted-foreground max-w-xl">Pilih dari katalog harian kami. Pesan satuan untuk makan siang, atau lihat tab Paket Catering untuk acara.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Button variant={activeCat === null ? "default" : "outline"} size="sm" onClick={() => setActiveCat(null)} className={activeCat === null ? "bg-gradient-hero text-primary-foreground" : ""}>
          Semua
        </Button>
        {categories?.filter(c => c.slug !== "paket-catering").map((c) => (
          <Button key={c.id} variant={activeCat === c.id ? "default" : "outline"} size="sm" onClick={() => setActiveCat(c.id)} className={activeCat === c.id ? "bg-gradient-hero text-primary-foreground" : ""}>
            {c.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Memuat menu...</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items?.map((m) => <MenuCard key={m.id} item={m} />)}
        </div>
      )}
    </div>
  );
}
