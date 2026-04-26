import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MessageCircle, ImageIcon, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah, formatDate } from "@/lib/format";
import { STATUS_LABEL, STATUS_OPTIONS, STATUS_VARIANT, STATUS_DESCRIPTION, type OrderStatus } from "@/lib/orderStatus";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const qc = useQueryClient();
  const { settings } = useSiteSettings();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [proofOrder, setProofOrder] = useState<{ path: string | null; orderNumber: string; method: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status diperbarui"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const waLink = (o: any) => {
    const num = String(o.customer_phone).replace(/\D/g, "").replace(/^0/, "62");
    const msg = encodeURIComponent(
      `Halo ${o.customer_name}, pesanan *${o.order_number}* di ${settings.brand_name} sekarang berstatus *${STATUS_LABEL[o.status as OrderStatus]}*.\n\n${STATUS_DESCRIPTION[o.status as OrderStatus]}\n\nTotal: ${formatRupiah(Number(o.total))}\n\nTerima kasih! 🙏`
    );
    return `https://wa.me/${num}?text=${msg}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-display text-2xl font-bold">Kelola Pesanan</h2>
        <Select value={filter} onValueChange={(v) => setFilter(v as OrderStatus | "all")}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat...</div>
      ) : !data?.length ? (
        <div className="text-center py-12 text-muted-foreground">Tidak ada pesanan.</div>
      ) : (
        <div className="space-y-3">
          {data.map((o) => (
            <div key={o.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-sm font-bold text-primary">{o.order_number}</div>
                  <div className="text-sm font-medium mt-1">{o.customer_name} • {o.customer_phone}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(o.created_at)}</div>
                  <div className="mt-2 flex gap-2 text-xs flex-wrap">
                    <Badge variant="outline">{o.delivery_method === "delivery" ? "Antar" : "Pickup"}</Badge>
                    <Badge variant="outline">{o.payment_method === "transfer" ? "Transfer" : "COD"}</Badge>
                    {o.payment_method === "transfer" && (
                      <Badge variant={o.payment_proof_url ? "default" : "outline"} className="text-[10px]">
                        {o.payment_proof_url ? "Bukti diunggah" : "Belum ada bukti"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-bold text-primary">{formatRupiah(Number(o.total))}</div>
                  <Badge variant={STATUS_VARIANT[o.status as OrderStatus]} className="mt-1">{STATUS_LABEL[o.status as OrderStatus]}</Badge>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                  <SelectTrigger className="w-52 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                {o.payment_method === "transfer" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProofOrder({ path: o.payment_proof_url, orderNumber: o.order_number, method: o.payment_method })}
                  >
                    <ImageIcon className="mr-1 h-4 w-4" /> Lihat Bukti Bayar
                  </Button>
                )}
                <a href={waLink(o)} target="_blank" rel="noreferrer">
                  <Button size="sm" className="bg-[#25D366] text-white hover:bg-[#1ebe57]">
                    <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaymentProofDialog
        open={!!proofOrder}
        onOpenChange={(v) => !v && setProofOrder(null)}
        path={proofOrder?.path ?? null}
        orderNumber={proofOrder?.orderNumber ?? ""}
      />
    </div>
  );
}

function PaymentProofDialog({
  open, onOpenChange, path, orderNumber,
}: { open: boolean; onOpenChange: (v: boolean) => void; path: string | null; orderNumber: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setUrl(null);
    if (!open || !path) return;
    setLoading(true);
    supabase.storage.from("payment-proofs").createSignedUrl(path, 60 * 10).then(({ data, error }) => {
      setLoading(false);
      if (!error && data) setUrl(data.signedUrl);
    });
  }, [open, path]);

  const handleDownload = async () => {
    if (!path) return;
    setDownloading(true);
    const { data, error } = await supabase.storage.from("payment-proofs").download(path);
    setDownloading(false);
    if (error || !data) { toast.error("Gagal mengunduh bukti"); return; }
    const ext = path.split(".").pop() || "jpg";
    const blobUrl = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `bukti-bayar-${orderNumber}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    toast.success("Bukti pembayaran diunduh");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bukti Pembayaran — {orderNumber}</DialogTitle>
        </DialogHeader>
        {!path ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-12 text-center text-sm text-muted-foreground">
            Pelanggan belum mengunggah bukti pembayaran.
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            <div className="mt-2">Memuat bukti...</div>
          </div>
        ) : url ? (
          <div className="space-y-3">
            <img src={url} alt="Bukti pembayaran" className="w-full max-h-[70vh] object-contain rounded-xl bg-muted" />
            <div className="flex justify-end gap-2">
              <a href={url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">Buka di tab baru</Button>
              </a>
              <Button size="sm" onClick={handleDownload} disabled={downloading} className="bg-gradient-hero text-primary-foreground">
                {downloading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
                Unduh
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-destructive">Gagal memuat bukti pembayaran.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
