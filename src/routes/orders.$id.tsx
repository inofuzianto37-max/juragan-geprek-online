import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Phone, Wallet, Truck, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/format";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/orderStatus";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({ meta: [{ title: "Detail Pesanan — Juragan Geprek" }] }),
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Memuat...</div>;
  if (!order) return <div className="container mx-auto px-4 py-20 text-center">Pesanan tidak ditemukan.</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <div className="rounded-2xl border border-border/60 bg-gradient-hero p-6 text-primary-foreground shadow-warm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">Nomor Pesanan</div>
            <div className="font-mono text-xl font-bold mt-1">{order.order_number}</div>
            <div className="text-sm opacity-90 mt-1">{formatDate(order.created_at)}</div>
          </div>
          <Badge variant={STATUS_VARIANT[order.status]} className="bg-background text-foreground capitalize">
            {STATUS_LABEL[order.status]}
          </Badge>
        </div>
        <div className="mt-4 text-3xl font-display font-bold">{formatRupiah(Number(order.total))}</div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info icon={Phone} label="Pemesan" value={`${order.customer_name} • ${order.customer_phone}`} />
        <Info
          icon={order.delivery_method === "delivery" ? Truck : Store}
          label={order.delivery_method === "delivery" ? "Pengiriman" : "Pickup"}
          value={order.delivery_method === "delivery" ? (order.delivery_address || "-") : "Ambil di outlet"}
        />
        <Info icon={Wallet} label="Pembayaran" value={order.payment_method === "transfer" ? "Transfer Bank" : "COD / Bayar di Tempat"} />
        {order.notes && <Info icon={MapPin} label="Catatan" value={order.notes} />}
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
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

      {order.payment_method === "transfer" && order.status === "pending" && (
        <div className="mt-6 rounded-2xl border-2 border-warning/30 bg-warning/10 p-5 text-sm">
          <div className="font-semibold text-warning-foreground">Menunggu pembayaran</div>
          <div className="mt-1 text-muted-foreground">
            Transfer ke <strong>BCA 1234567890 a.n. Juragan Geprek</strong> sebesar{" "}
            <strong className="text-primary">{formatRupiah(Number(order.total))}</strong>, lalu kirim bukti ke WA{" "}
            <strong>0812-3456-7890</strong>.
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
