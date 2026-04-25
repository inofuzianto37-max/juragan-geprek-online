import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: string;
  brand_name: string;
  brand_tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_badge: string;
  about_text: string;
  address: string;
  whatsapp: string;
  email: string;
  open_hours: string;
  instagram: string | null;
  google_maps_url: string | null;
  cta_event_title: string;
  cta_event_subtitle: string;
}

const FALLBACK: SiteSettings = {
  id: "",
  brand_name: "Juragan Geprek",
  brand_tagline: "E-Catering",
  hero_title: "Geprek Hangat, Catering Juara.",
  hero_subtitle:
    "Dari porsi satuan untuk makan siang sampai paket catering ratusan porsi untuk acaramu — semua diolah segar setiap hari.",
  hero_badge: "Pedasnya Bikin Nagih",
  about_text:
    "Catering geprek otentik untuk acara dan harian. Pedasnya bikin nagih, hangatnya bikin betah.",
  address: "Jl. Geprek Raya No. 1, Kota Anda",
  whatsapp: "0812-3456-7890",
  email: "hello@juragangeprek.id",
  open_hours: "09.00 – 22.00 WIB",
  instagram: null,
  google_maps_url: null,
  cta_event_title: "Punya event spesial?",
  cta_event_subtitle:
    "Catering geprek 25–100+ porsi siap diantar atau di-pickup. Cocok untuk arisan, kantor, dan syukuran.",
};

export function useSiteSettings() {
  const { data, ...rest } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as SiteSettings) ?? FALLBACK;
    },
    staleTime: 60_000,
  });
  return { settings: data ?? FALLBACK, ...rest };
}
