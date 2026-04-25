import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

  const save = async () => {
    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      stock: Number(form.stock),
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      is_available: form.is_available,
      is_catering_package: form.is_catering_package,
      min_porsi: Number(form.min_porsi),
    };
    if (!payload.name || isNaN(payload.price)) { toast.error("Nama & harga wajib"); return; }
    const { error } = form.id
      ? await supabase.from("menu_items").update(payload).eq("id", form.id)
      : await supabase.from("menu_items").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Menu disimpan"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-menu"] }); }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus menu ini?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["admin-menu"] }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Menu & Inventaris</h2>
        <Button onClick={startNew} className="bg-gradient-hero text-primary-foreground shadow-warm">
          <Plus className="mr-1 h-4 w-4" /> Tambah Menu
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat...</div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 rounded-lg bg-gradient-warm overflow-hidden flex-shrink-0">
                  {item.image_url && <img src={item.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{item.name}</span>
                    {item.is_catering_package && <Badge variant="secondary" className="text-xs">Catering</Badge>}
                    {!item.is_available && <Badge variant="destructive" className="text-xs">Nonaktif</Badge>}
                    {item.stock <= 5 && <Badge variant="outline" className="text-xs border-warning text-warning-foreground">Stok rendah</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.menu_categories?.name || "Tanpa kategori"} • Stok: {item.stock}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{formatRupiah(Number(item.price))}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <div><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Harga (Rp)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Stok</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
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
            <div><Label>URL Gambar (opsional)</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Tersedia untuk dipesan</Label>
              <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><Label>Paket Catering</Label><div className="text-xs text-muted-foreground">Untuk porsi besar/event</div></div>
              <Switch checked={form.is_catering_package} onCheckedChange={(v) => setForm({ ...form, is_catering_package: v })} />
            </div>
            {form.is_catering_package && (
              <div><Label>Min. Porsi</Label><Input type="number" value={form.min_porsi} onChange={(e) => setForm({ ...form, min_porsi: e.target.value })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-gradient-hero text-primary-foreground shadow-warm">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
