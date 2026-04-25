import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah, formatDate } from "@/lib/format";
import { STATUS_LABEL, STATUS_OPTIONS, STATUS_VARIANT, type OrderStatus } from "@/lib/orderStatus";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

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
                  <button onClick={() => setOpenId(o.id)} className="font-mono text-sm font-bold text-primary hover:underline">
                    {o.order_number}
                  </button>
                  <div className="text-sm font-medium mt-1">{o.customer_name} • {o.customer_phone}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(o.created_at)}</div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <Badge variant="outline">{o.delivery_method === "delivery" ? "Antar" : "Pickup"}</Badge>
                    <Badge variant="outline">{o.payment_method === "transfer" ? "Transfer" : "COD"}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-bold text-primary">{formatRupiah(Number(o.total))}</div>
                  <Badge variant={STATUS_VARIANT[o.status]} className="mt-1">{STATUS_LABEL[o.status]}</Badge>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                  <SelectTrigger className="w-52 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setOpenId(o.id)}>Detail</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detail Pesanan</DialogTitle></DialogHeader>
          {openId && <OrderDetail id={openId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetail({ id }: { id: string }) {
  const { data: order } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: items } = useQuery({
    queryKey: ["admin-order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (error) throw error;
      return data;
    },
  });

  if (!order) return <div className="py-4 text-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-muted-foreground">{order.order_number} • {formatDate(order.created_at)}</div>
      <div><strong>Pemesan:</strong> {order.customer_name} ({order.customer_phone})</div>
      <div><strong>Pengiriman:</strong> {order.delivery_method === "delivery" ? `Antar — ${order.delivery_address}` : "Pickup"}</div>
      <div><strong>Pembayaran:</strong> {order.payment_method === "transfer" ? "Transfer" : "COD"}</div>
      {order.notes && <div><strong>Catatan:</strong> {order.notes}</div>}
      <div className="border-t border-border pt-3 space-y-1">
        {items?.map((i) => (
          <div key={i.id} className="flex justify-between">
            <span>{i.item_name} × {i.quantity}</span>
            <span>{formatRupiah(Number(i.subtotal))}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-3 flex justify-between font-bold">
        <span>Total</span><span className="text-primary">{formatRupiah(Number(order.total))}</span>
      </div>
    </div>
  );
}
