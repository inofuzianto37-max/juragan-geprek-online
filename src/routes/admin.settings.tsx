import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, AlertCircle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings, type SiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

// Validation schema
const phoneRegex = /^(\+?\d[\d\s\-]{7,18}\d)$/;
const settingsSchema = z.object({
  brand_name: z.string().trim().min(2, "Nama brand minimal 2 karakter"),
  brand_tagline: z.string().trim().min(1, "Tagline tidak boleh kosong"),
  hero_title: z.string().trim().min(3, "Judul hero terlalu pendek"),
  hero_subtitle: z.string().trim().min(5, "Subjudul hero terlalu pendek"),
  hero_badge: z.string().trim().min(1, "Badge tidak boleh kosong"),
  about_text: z.string().trim().min(5, "Teks tentang terlalu pendek"),
  address: z.string().trim().min(5, "Alamat terlalu pendek"),
  whatsapp: z.string().trim()
    .min(9, "Nomor WhatsApp minimal 9 digit")
    .regex(phoneRegex, "Format WhatsApp tidak valid (contoh: 0812-3456-7890 atau +6281234567890)"),
  email: z.string().trim().email("Format email tidak valid"),
  open_hours: z.string().trim().min(3, "Jam buka tidak valid"),
  instagram: z.string().trim().regex(/^@?[a-zA-Z0-9_.]{1,30}$/, "Username Instagram tidak valid").nullable().or(z.literal("")),
  google_maps_url: z.string().trim().url("URL Google Maps tidak valid").nullable().or(z.literal("")),
  cta_event_title: z.string().trim().min(3, "Judul CTA terlalu pendek"),
  cta_event_subtitle: z.string().trim().min(5, "Subjudul CTA terlalu pendek"),
});

type Errors = Partial<Record<keyof SiteSettings, string>>;

function AdminSettingsPage() {
  const { settings, isLoading } = useSiteSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.id) setForm(settings);
  }, [settings]);

  const validate = (data: SiteSettings): Errors => {
    const result = settingsSchema.safeParse({
      ...data,
      instagram: data.instagram || "",
      google_maps_url: data.google_maps_url || "",
    });
    if (result.success) return {};
    const errs: Errors = {};
    for (const issue of result.error.issues) {
      const k = issue.path[0] as keyof SiteSettings;
      if (!errs[k]) errs[k] = issue.message;
    }
    return errs;
  };

  const liveErrors = useMemo(() => (touched ? validate(form) : {}), [form, touched]);
  const errorCount = Object.keys(liveErrors).length;

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Periksa kembali isian yang belum valid");
      return;
    }
    if (!form.id) { toast.error("Data pengaturan belum siap"); return; }
    setSaving(true);
    const { id, ...payload } = form;
    const { error } = await supabase.from("site_settings").update(payload).eq("id", id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Pengaturan situs disimpan");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    }
  };

  const shownErrors = touched ? liveErrors : errors;

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

      {touched && errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ada {errorCount} isian yang belum valid</AlertTitle>
          <AlertDescription>Perbaiki isian yang ditandai merah, lalu klik Simpan kembali.</AlertDescription>
        </Alert>
      )}

      <Section title="Identitas Brand">
        <Field label="Nama Brand" error={shownErrors.brand_name}>
          <Input value={form.brand_name} onChange={(e) => set("brand_name", e.target.value)} className={shownErrors.brand_name ? "border-destructive" : ""} />
        </Field>
        <Field label="Tagline (di bawah nama brand)" error={shownErrors.brand_tagline}>
          <Input value={form.brand_tagline} onChange={(e) => set("brand_tagline", e.target.value)} className={shownErrors.brand_tagline ? "border-destructive" : ""} />
        </Field>
        <Field label="Teks Tentang Kami (footer)" error={shownErrors.about_text}>
          <Textarea rows={3} value={form.about_text} onChange={(e) => set("about_text", e.target.value)} className={shownErrors.about_text ? "border-destructive" : ""} />
        </Field>
      </Section>

      <Section title="Hero Beranda">
        <Field label="Badge (kecil di atas judul)" error={shownErrors.hero_badge}>
          <Input value={form.hero_badge} onChange={(e) => set("hero_badge", e.target.value)} className={shownErrors.hero_badge ? "border-destructive" : ""} />
        </Field>
        <Field label="Judul Utama" error={shownErrors.hero_title}>
          <Input value={form.hero_title} onChange={(e) => set("hero_title", e.target.value)} className={shownErrors.hero_title ? "border-destructive" : ""} />
        </Field>
        <Field label="Subjudul" error={shownErrors.hero_subtitle}>
          <Textarea rows={3} value={form.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} className={shownErrors.hero_subtitle ? "border-destructive" : ""} />
        </Field>
        <Field label="CTA Event — Judul" error={shownErrors.cta_event_title}>
          <Input value={form.cta_event_title} onChange={(e) => set("cta_event_title", e.target.value)} className={shownErrors.cta_event_title ? "border-destructive" : ""} />
        </Field>
        <Field label="CTA Event — Subjudul" error={shownErrors.cta_event_subtitle}>
          <Textarea rows={2} value={form.cta_event_subtitle} onChange={(e) => set("cta_event_subtitle", e.target.value)} className={shownErrors.cta_event_subtitle ? "border-destructive" : ""} />
        </Field>
      </Section>

      <Section title="Kontak & Alamat">
        <Field label="Alamat" error={shownErrors.address}>
          <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} className={shownErrors.address ? "border-destructive" : ""} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="WhatsApp"
            error={shownErrors.whatsapp}
            hint="Format: 0812-3456-7890 atau +6281234567890"
          >
            <Input
              inputMode="tel"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              className={shownErrors.whatsapp ? "border-destructive" : ""}
              placeholder="0812-3456-7890"
            />
          </Field>
          <Field label="Email" error={shownErrors.email}>
            <Input
              type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={shownErrors.email ? "border-destructive" : ""}
              placeholder="hello@juragangeprek.id"
            />
          </Field>
          <Field label="Jam Buka" error={shownErrors.open_hours}>
            <Input value={form.open_hours} onChange={(e) => set("open_hours", e.target.value)} className={shownErrors.open_hours ? "border-destructive" : ""} />
          </Field>
          <Field label="Instagram (username, opsional)" error={shownErrors.instagram} hint="Tanpa @ atau dengan @, mis. juragangeprek">
            <Input
              value={form.instagram ?? ""}
              onChange={(e) => set("instagram", e.target.value || null)}
              className={shownErrors.instagram ? "border-destructive" : ""}
              placeholder="juragangeprek"
            />
          </Field>
        </div>
        <Field
          label="Google Maps URL (opsional)"
          error={shownErrors.google_maps_url}
          hint="Salin URL bagikan dari Google Maps. Bisa juga URL embed."
        >
          <Input
            placeholder="https://maps.app.goo.gl/..."
            value={form.google_maps_url ?? ""}
            onChange={(e) => set("google_maps_url", e.target.value || null)}
            className={shownErrors.google_maps_url ? "border-destructive" : ""}
          />
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

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
