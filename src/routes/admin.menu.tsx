import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Pencil, Plus, Trash2, Upload, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/menu")({
  component: AdminMenuPage,
});

interface FormState {
  id?: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
  image_url: string;
  is_available: boolean;
  is_catering_package: boolean;
  min_porsi: string;
}

const empty: FormState = {
  name: "", description: "", price: "", stock: "0", category_id: "",
  image_url: "", is_available: true, is_catering_package: false, min_porsi: "1",
};

function AdminMenuPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_categories").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*,menu_categories(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const startNew = () => { setForm(empty); setOpen(true); };
  const startEdit = (item: any) => {
    setForm({
      id: item.id, name: item.name, description: item.description || "",
      price: String(item.price), stock: String(item.stock), category_id: item.category_id || "",
      image_url: item.image_url || "", is_available: item.is_available,
      is_catering_package: item.is_catering_package, min_porsi: String(item.min_porsi),
    });
    setOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("File harus berupa gambar"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Maks 5MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `menu/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("menu-images").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("menu-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: pub.publicUrl }));
      toast.success("Foto diunggah");
    } catch (e: any) {
      toast.error(e.message || "Gagal upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = async () => {
    // Try to delete the underlying object if it lives in our bucket
    const url = form.image_url;
    if (url) {
      const marker = "/menu-images/";
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        const path = url.slice(idx + marker.length);
        await supabase.storage.from("menu-images").remove([path]).catch(() => {});
      }
    }
    setForm((f) => ({ ...f, image_url: "" }));
  };

  const save = async () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      stock: Number(form.stock),
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      is_available: form.is_available,
      is_catering_package: form.is_catering_package,
      min_porsi: Number(form.min_porsi) || 1,
    };
    if (!payload.name) { toast.error("Nama menu wajib diisi"); return; }
    if (isNaN(payload.price) || payload.price < 0) { toast.error("Harga harus angka ≥ 0"); return; }
    if (isNaN(payload.stock) || payload.stock < 0) { toast.error("Stok harus angka ≥ 0"); return; }
    setSaving(true);
    const { error } = form.id
      ? await supabase.from("menu_items").update(payload).eq("id", form.id)
      : await supabase.from("menu_items").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Menu disimpan"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-menu"] }); }
  };

  const remove = async (id: string, image_url: string | null) => {
    if (!confirm("Hapus menu ini?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    // Cleanup image
    if (image_url) {
      const marker = "/menu-images/";
      const idx = image_url.indexOf(marker);
      if (idx !== -1) {
        const path = image_url.slice(idx + marker.length);
        await supabase.storage.from("menu-images").remove([path]).catch(() => {});
      }
    }
    toast.success("Dihapus");
    qc.invalidateQueries({ queryKey: ["admin-menu"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Menu & Inventaris</h2>
          <p className="text-sm text-muted-foreground">Tambah, ubah harga, foto, kategori, stok, dan ketersediaan menu.</p>
        </div>
        <Button onClick={startNew} className="bg-gradient-hero text-primary-foreground shadow-warm">
          <Plus className="mr-1 h-4 w-4" /> Tambah Menu
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat...</div>
      ) : !items?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Belum ada menu. Klik <strong>Tambah Menu</strong> untuk mulai.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 rounded-lg bg-gradient-warm overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{item.name}</span>
                    {item.is_catering_package && <Badge variant="secondary" className="text-xs">Catering</Badge>}
                    {!item.is_available && <Badge variant="destructive" className="text-xs">Nonaktif</Badge>}
                    {item.stock <= 5 && <Badge variant="outline" className="text-xs border-warning">Stok rendah</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.menu_categories?.name || "Tanpa kategori"} • Stok: {item.stock}
                  </div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{formatRupiah(Number(item.price))}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(item)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(item.id, item.image_url)} aria-label="Hapus"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit Menu" : "Tambah Menu"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {/* Photo */}
            <div>
              <Label>Foto Menu</Label>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-24 w-24 rounded-xl bg-gradient-warm border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                  {form.image_url ? (
                    <img src={form.image_url} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                      {uploading ? "Mengunggah..." : (form.image_url ? "Ganti foto" : "Upload foto")}
                    </Button>
                    {form.image_url && (
                      <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
                        <X className="mr-1 h-4 w-4" /> Hapus
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG/PNG/WebP, maks 5MB. Disimpan di galeri menu.</p>
                </div>
              </div>
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">Atau tempel URL gambar</Label>
                <Input className="mt-1" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>

            <div><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Harga (Rp)</Label><Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Stok</Label><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label>Tersedia untuk dipesan</Label>
                <div className="text-xs text-muted-foreground">Matikan untuk menyembunyikan dari katalog.</div>
              </div>
              <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><Label>Paket Catering</Label><div className="text-xs text-muted-foreground">Untuk porsi besar/event</div></div>
              <Switch checked={form.is_catering_package} onCheckedChange={(v) => setForm({ ...form, is_catering_package: v })} />
            </div>
            {form.is_catering_package && (
              <div><Label>Min. Porsi</Label><Input type="number" min="1" value={form.min_porsi} onChange={(e) => setForm({ ...form, min_porsi: e.target.value })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={save} disabled={saving || uploading} className="bg-gradient-hero text-primary-foreground shadow-warm">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
