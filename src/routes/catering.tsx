import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MenuCard, type MenuItemRow } from "@/components/MenuCard";

export const Route = createFileRoute("/catering")({
  head: () => ({
    meta: [
      { title: "Paket Catering — Juragan Geprek" },
      { name: "description", content: "Paket catering geprek 25, 50, dan 100+ porsi untuk acara kantor, arisan, dan syukuran." },
    ],
  }),
  component: CateringPage,
});

function CateringPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["catering"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").eq("is_catering_package", true).eq("is_available", true).order("price");
      if (error) throw error;
      return data as MenuItemRow[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-3">
          <Users className="h-3 w-3" /> Untuk Event & Acara
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold">Paket Catering Geprek</h1>
        <p className="mt-3 text-muted-foreground text-lg">
          Solusi catering praktis untuk acara kantor, arisan, syukuran, hingga event besar. Diantar segar atau pickup di outlet.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Memuat paket...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((m) => <MenuCard key={m.id} item={m} />)}
        </div>
      )}

      <div className="mt-16 rounded-2xl border border-border/60 bg-card p-8 shadow-card">
        <h3 className="font-display text-2xl font-bold">Butuh paket khusus?</h3>
        <p className="mt-2 text-muted-foreground">
          Untuk pesanan di atas 100 porsi atau menu kustom, hubungi kami via WhatsApp di <span className="font-semibold text-primary">0812-3456-7890</span>.
        </p>
      </div>
    </div>
  );
}
