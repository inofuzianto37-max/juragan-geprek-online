import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, DollarSign, Package, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, items] = await Promise.all([
        supabase.from("orders").select("status,total"),
        supabase.from("menu_items").select("id,stock,is_available"),
      ]);
      const allOrders = orders.data || [];
      const pending = allOrders.filter((o) => o.status === "pending").length;
      const revenue = allOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);
      const lowStock = (items.data || []).filter((i) => i.stock <= 5).length;
      return { totalOrders: allOrders.length, pending, revenue, lowStock };
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total Pesanan" value={stats?.totalOrders ?? "-"} />
        <StatCard icon={Package} label="Menunggu" value={stats?.pending ?? "-"} highlight />
        <StatCard icon={DollarSign} label="Pendapatan Selesai" value={stats ? formatRupiah(stats.revenue) : "-"} />
        <StatCard icon={AlertTriangle} label="Stok Menipis (≤5)" value={stats?.lowStock ?? "-"} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold">Selamat datang, Admin!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Gunakan menu di samping untuk mengelola pesanan masuk dan inventaris menu.
          Pesanan baru akan muncul dengan status <strong>Menunggu Konfirmasi</strong> dan perlu Anda konfirmasi setelah pembayaran/pickup terverifikasi.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: { icon: React.ElementType; label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-card ${highlight ? "border-primary bg-primary/5" : "border-border/60 bg-card"}`}>
      <Icon className={`h-6 w-6 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      <div className="mt-3 text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
