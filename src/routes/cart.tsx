import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Keranjang — Juragan Geprek" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 font-display text-3xl font-bold">Keranjang masih kosong</h1>
        <p className="mt-2 text-muted-foreground">Yuk pilih geprek favoritmu dulu.</p>
        <Button asChild className="mt-6 bg-gradient-hero text-primary-foreground shadow-warm">
          <Link to="/menu">Lihat Menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold mb-8">Keranjang Belanja</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-warm">
                {i.image_url ? <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{i.name}</h3>
                    <div className="text-sm text-primary font-bold">{formatRupiah(i.price)}</div>
                    {i.is_catering_package && <div className="text-xs text-muted-foreground mt-0.5">Min. {i.min_porsi} porsi</div>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(i.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(i.id, i.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="min-w-10 text-center font-semibold">{i.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(i.id, i.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <div className="ml-auto font-bold">{formatRupiah(i.price * i.quantity)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-border/60 bg-card p-6 shadow-card sticky top-24">
          <h3 className="font-display text-xl font-bold mb-4">Ringkasan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatRupiah(total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span className="text-muted-foreground">Dihitung saat checkout</span></div>
          </div>
          <div className="my-4 h-px bg-border" />
          <div className="flex justify-between font-display text-lg font-bold">
            <span>Total</span><span className="text-primary">{formatRupiah(total)}</span>
          </div>
          <Button
            className="mt-6 w-full bg-gradient-hero text-primary-foreground shadow-warm hover:opacity-90"
            size="lg"
            onClick={() => {
              if (!user) navigate({ to: "/auth", search: { redirect: "/checkout" } });
              else navigate({ to: "/checkout" });
            }}
          >
            Lanjut ke Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
