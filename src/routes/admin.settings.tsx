import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings, type SiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { settings, isLoading } = useSiteSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.id) setForm(settings);
  }, [settings]);

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.id) {
      toast.error("Data pengaturan belum siap");
      return;
    }
    setSaving(true);
    const { id, ...payload } = form;
    const { error } = await supabase
      .from("site_settings")
      .update(payload)
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Pengaturan situs disimpan");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Pengaturan Situs</h2>
          <p className="text-sm text-muted-foreground">Kelola identitas brand, hero, kontak, dan alamat yang tampil di seluruh website.</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-gradient-hero text-primary-foreground shadow-warm">
          <Save className="mr-2 h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>

      <Section title="Identitas Brand">
        <Field label="Nama Brand">
          <Input value={form.brand_name} onChange={(e) => set("brand_name", e.target.value)} />
        </Field>
        <Field label="Tagline (di bawah nama brand)">
          <Input value={form.brand_tagline} onChange={(e) => set("brand_tagline", e.target.value)} />
        </Field>
        <Field label="Teks Tentang Kami (footer)">
          <Textarea rows={3} value={form.about_text} onChange={(e) => set("about_text", e.target.value)} />
        </Field>
      </Section>

      <Section title="Hero Beranda">
        <Field label="Badge (kecil di atas judul)">
          <Input value={form.hero_badge} onChange={(e) => set("hero_badge", e.target.value)} />
        </Field>
        <Field label="Judul Utama">
          <Input value={form.hero_title} onChange={(e) => set("hero_title", e.target.value)} />
        </Field>
        <Field label="Subjudul">
          <Textarea rows={3} value={form.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} />
        </Field>
        <Field label="CTA Event — Judul">
          <Input value={form.cta_event_title} onChange={(e) => set("cta_event_title", e.target.value)} />
        </Field>
        <Field label="CTA Event — Subjudul">
          <Textarea rows={2} value={form.cta_event_subtitle} onChange={(e) => set("cta_event_subtitle", e.target.value)} />
        </Field>
      </Section>

      <Section title="Kontak & Alamat">
        <Field label="Alamat">
          <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Jam Buka">
            <Input value={form.open_hours} onChange={(e) => set("open_hours", e.target.value)} />
          </Field>
          <Field label="Instagram (username, opsional)">
            <Input value={form.instagram ?? ""} onChange={(e) => set("instagram", e.target.value || null)} />
          </Field>
        </div>
        <Field label="Google Maps URL (opsional)">
          <Input placeholder="https://maps.app.goo.gl/..." value={form.google_maps_url ?? ""} onChange={(e) => set("google_maps_url", e.target.value || null)} />
        </Field>
      </Section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-gradient-hero text-primary-foreground shadow-warm">
          <Save className="mr-2 h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card space-y-4">
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
