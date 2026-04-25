import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/format";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/orderStatus";

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Pesanan Saya — Juragan Geprek" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/orders" } });
  }, [user, loading, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold mb-8">Pesanan Saya</h1>
      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Memuat...</div>
      ) : !data?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">Belum ada pesanan.</p>
          <Button asChild className="mt-4 bg-gradient-hero text-primary-foreground"><Link to="/menu">Pesan Sekarang</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((o) => (
            <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="block rounded-2xl border border-border/60 bg-card p-5 shadow-card transition hover:shadow-warm hover:-translate-y-0.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">{o.order_number}</div>
                  <div className="font-display text-lg font-bold mt-1">{formatRupiah(Number(o.total))}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(o.created_at)}</div>
                </div>
                <Badge variant={STATUS_VARIANT[o.status]} className="capitalize">{STATUS_LABEL[o.status]}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
