import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Phone, MapPin, Wallet, Truck, Store, MessageCircle, User as UserIcon, Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatRupiah, formatDate } from "@/lib/format";
import {
  STATUS_LABEL, STATUS_VARIANT, STATUS_DESCRIPTION, STATUS_ICON, STATUS_FLOW, STATUS_OPTIONS,
  type OrderStatus,
} from "@/lib/orderStatus";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Detail Pesanan — Admin" }] }),
  component: AdminOrderDetail,
});

interface HistoryRow {
  id: string;
  status: OrderStatus;
  changed_at: string;
  note: string | null;
  changed_by: string | null;
}

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { settings } = useSiteSettings();
  const [note, setNote] = useState("");
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", search: { redirect: `/admin/orders/${id}` } });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate, id]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: items } = useQuery({
    queryKey: ["admin-order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: history } = useQuery({
    queryKey: ["admin-order-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_status_history")
        .select("id,status,changed_at,note,changed_by")
        .eq("order_id", id)
        .order("changed_at", { ascending: true });
      if (error) throw error;
      return (data || []) as HistoryRow[];
    },
    enabled: !!isAdmin,
  });

  // Resolve names of users who changed status (admin can read all profiles)
  const userIds = Array.from(
    new Set((history || []).map((h) => h.changed_by).filter((x): x is string => !!x))
  );
  const { data: profileMap } = useQuery({
    queryKey: ["admin-profile-names", userIds.sort().join(",")],
    enabled: isAdmin && userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id,full_name")
        .in("user_id", userIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((p) => { map[p.user_id] = p.full_name; });
      return map;
    },
  });

  const updateStatus = async () => {
    if (!nextStatus || !order) return;
    if (nextStatus === order.status) {
      toast.error("Status sama dengan saat ini");
      return;
    }
    setUpdating(true);
    // Update status
    const { error: upErr } = await supabase
      .from("orders").update({ status: nextStatus }).eq("id", id);
    if (upErr) { setUpdating(false); toast.error(upErr.message); return; }

    // Add note to the history row that the trigger just inserted (latest one matching new status)
    if (note.trim()) {
      const { data: latest } = await supabase
        .from("order_status_history")
        .select("id").eq("order_id", id).eq("status", nextStatus)
        .order("changed_at", { ascending: false }).limit(1).maybeSingle();
      if (latest?.id) {
        await supabase.from("order_status_history").update({ note: note.trim() }).eq("id", latest.id);
      }
    }

    setUpdating(false);
    setNote(""); setNextStatus("");
    toast.success("Status diperbarui");
    qc.invalidateQueries({ queryKey: ["admin-order-detail", id] });
    qc.invalidateQueries({ queryKey: ["admin-order-history", id] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  if (!isAdmin) return null;
  if (isLoading || !order) {
    return <div className="text-center py-12 text-muted-foreground">Memuat...</div>;
  }

  const status = order.status as OrderStatus;
  const waNumber = order.customer_phone.replace(/\D/g, "").replace(/^0/, "62");
  const brand = settings.brand_name;
  const waMessage = encodeURIComponent(
    `Halo ${order.customer_name}, pesanan *${order.order_number}* di ${brand} sekarang berstatus *${STATUS_LABEL[status]}*.\n\n${STATUS_DESCRIPTION[status]}\n\nTotal: ${formatRupiah(Number(order.total))}\n\nTerima kasih telah memesan! 🙏`
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="space-y-6">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar pesanan
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-hero p-6 text-primary-foreground shadow-warm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">Nomor Pesanan</div>
            <div className="font-mono text-xl font-bold mt-1">{order.order_number}</div>
            <div className="text-sm opacity-90 mt-1">Dibuat {formatDate(order.created_at)}</div>
          </div>
          <Badge variant={STATUS_VARIANT[status]} className="bg-background text-foreground capitalize">
            {STATUS_LABEL[status]}
          </Badge>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3 flex-wrap">
          <div className="text-3xl font-display font-bold">{formatRupiah(Number(order.total))}</div>
          <a href={waUrl} target="_blank" rel="noreferrer">
            <Button className="bg-[#25D366] text-white hover:bg-[#1ebe57]">
              <MessageCircle className="mr-2 h-4 w-4" /> Kirim WhatsApp
            </Button>
          </a>
        </div>
      </div>

      {/* Customer + meta */}
      <div className="grid gap-4 md:grid-cols-2">
        <Info icon={Phone} label="Pemesan">
          <div>{order.customer_name}</div>
          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {order.customer_phone}
          </a>
        </Info>
        <Info
          icon={order.delivery_method === "delivery" ? Truck : Store}
          label={order.delivery_method === "delivery" ? "Pengiriman" : "Pickup"}
        >
          <div>{order.delivery_method === "delivery" ? (order.delivery_address || "-") : "Ambil di outlet"}</div>
        </Info>
        <Info icon={Wallet} label="Pembayaran">
          <div>{order.payment_method === "transfer" ? "Transfer Bank" : "COD / Bayar di Tempat"}</div>
        </Info>
        {order.notes && (
          <Info icon={MapPin} label="Catatan Pelanggan">
            <div className="text-sm">{order.notes}</div>
          </Info>
        )}
      </div>

      {order.payment_method === "transfer" && (
        <AdminPaymentProof path={order.payment_proof_url} />
      )}

      {/* Status update */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold">Perbarui Status</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Setelah memperbarui, klik <strong>Kirim WhatsApp</strong> di atas untuk memberitahu pelanggan otomatis.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[200px_1fr_auto] items-end">
          <div>
            <Label className="text-xs">Status baru</Label>
            <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as OrderStatus)}>
              <SelectTrigger><SelectValue placeholder="Pilih status..." /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Catatan (opsional)</Label>
            <Textarea
              rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="cth. Pembayaran sudah diterima, kurir berangkat 12.30"
            />
          </div>
          <Button onClick={updateStatus} disabled={!nextStatus || updating} className="bg-gradient-hero text-primary-foreground shadow-warm">
            <Save className="mr-2 h-4 w-4" /> {updating ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold mb-1">Riwayat Perubahan Status</h3>
        <p className="text-xs text-muted-foreground mb-5">
          Semua perubahan status dicatat otomatis lengkap dengan waktu, pelaku, dan catatan (jika ada).
        </p>
        {(history || []).length === 0 ? (
          <div className="text-sm text-muted-foreground">Belum ada riwayat.</div>
        ) : (
          <div className="space-y-4">
            {(history || []).map((h, idx) => {
              const Icon = STATUS_ICON[h.status];
              const isLast = idx === (history?.length || 0) - 1;
              const isCurrent = h.status === status && isLast;
              const actorName = h.changed_by
                ? (h.changed_by === order.user_id
                    ? `${order.customer_name} (pelanggan)`
                    : profileMap?.[h.changed_by] || "Admin")
                : "Sistem";
              return (
                <div key={h.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                      h.status === "cancelled"
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : isCurrent
                        ? "bg-primary text-primary-foreground border-primary ring-4 ring-primary/20"
                        : "bg-primary text-primary-foreground border-primary"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && <div className="mt-1 w-0.5 flex-1 min-h-6 bg-primary/40" />}
                  </div>
                  <div className="pb-4 pt-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{STATUS_LABEL[h.status]}</span>
                      {isCurrent && <Badge variant="default" className="text-[10px] py-0 px-1.5">Status saat ini</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{formatDate(h.changed_at)}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="h-3 w-3" /> {actorName}
                      </span>
                    </div>
                    {h.note && (
                      <div className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                        {h.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold mb-4">Item Pesanan</h3>
        <div className="space-y-3">
          {items?.map((i) => (
            <div key={i.id} className="flex justify-between gap-3 text-sm">
              <div>
                <div className="font-medium">{i.item_name}</div>
                <div className="text-muted-foreground text-xs">{formatRupiah(Number(i.unit_price))} × {i.quantity}</div>
              </div>
              <div className="font-semibold">{formatRupiah(Number(i.subtotal))}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border space-y-1 text-sm">
          <Row label="Subtotal" value={formatRupiah(Number(order.subtotal))} />
          <Row label="Ongkir" value={formatRupiah(Number(order.delivery_fee))} />
          <div className="pt-2 mt-2 border-t border-border flex justify-between font-display text-lg font-bold">
            <span>Total</span><span className="text-primary">{formatRupiah(Number(order.total))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}

function AdminPaymentProof({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUrl(null);
    if (!path) return;
    setLoading(true);
    supabase.storage.from("payment-proofs").createSignedUrl(path, 60 * 10).then(({ data, error }) => {
      setLoading(false);
      if (!error && data) setUrl(data.signedUrl);
    });
  }, [path]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
      <h3 className="font-display text-lg font-bold mb-1">Bukti Pembayaran</h3>
      <p className="text-xs text-muted-foreground mb-4">
        {path ? "Verifikasi bukti transfer pelanggan sebelum mengubah status menjadi Dikonfirmasi." : "Pelanggan belum mengunggah bukti pembayaran."}
      </p>
      {loading && <div className="text-sm text-muted-foreground">Memuat...</div>}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img src={url} alt="Bukti pembayaran" className="max-h-96 w-auto rounded-xl border border-border/60 object-contain bg-muted" />
        </a>
      )}
      {!path && (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Belum ada bukti pembayaran.
        </div>
      )}
    </div>
  );
}
