-- Site-wide settings (single row, key-value JSON)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL DEFAULT 'Juragan Geprek',
  brand_tagline TEXT NOT NULL DEFAULT 'E-Catering',
  hero_title TEXT NOT NULL DEFAULT 'Geprek Hangat, Catering Juara.',
  hero_subtitle TEXT NOT NULL DEFAULT 'Dari porsi satuan untuk makan siang sampai paket catering ratusan porsi untuk acaramu — semua diolah segar setiap hari.',
  hero_badge TEXT NOT NULL DEFAULT 'Pedasnya Bikin Nagih',
  about_text TEXT NOT NULL DEFAULT 'Catering geprek otentik untuk acara dan harian. Pedasnya bikin nagih, hangatnya bikin betah.',
  address TEXT NOT NULL DEFAULT 'Jl. Geprek Raya No. 1, Kota Anda',
  whatsapp TEXT NOT NULL DEFAULT '0812-3456-7890',
  email TEXT NOT NULL DEFAULT 'hello@juragangeprek.id',
  open_hours TEXT NOT NULL DEFAULT '09.00 – 22.00 WIB',
  instagram TEXT,
  google_maps_url TEXT,
  cta_event_title TEXT NOT NULL DEFAULT 'Punya event spesial?',
  cta_event_subtitle TEXT NOT NULL DEFAULT 'Catering geprek 25–100+ porsi siap diantar atau di-pickup. Cocok untuk arisan, kantor, dan syukuran.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  singleton BOOLEAN NOT NULL DEFAULT TRUE UNIQUE
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed single row
INSERT INTO public.site_settings (singleton) VALUES (TRUE) ON CONFLICT DO NOTHING;