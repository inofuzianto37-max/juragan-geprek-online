import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Truck, Store, Banknote, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Juragan Geprek" }] }),
  component: CheckoutPage,
});

const DELIVERY_FEE = 10000;

function CheckoutPage() {
  const { user, loading } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState<"delivery" | "pickup">("delivery");
  const [payment, setPayment] = useState<"transfer" | "cod">("transfer");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/checkout" } });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,phone,address").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setName(data.full_name || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
        }
      });
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p>Keranjang kosong.</p>
        <Button asChild className="mt-4"><Link to="/menu">Lihat Menu</Link></Button>
      </div>
    );
  }

  const deliveryFee = delivery === "delivery" ? DELIVERY_FEE : 0;
  const grandTotal = total + deliveryFee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (delivery === "delivery" && !address.trim()) { toast.error("Alamat pengiriman wajib diisi"); return; }
    setBusy(true);

    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: name,
      customer_phone: phone,
      delivery_method: delivery,
      delivery_address: delivery === "delivery" ? address : null,
      payment_method: payment,
      notes: notes || null,
      subtotal: total,
      delivery_fee: deliveryFee,
      total: grandTotal,
      status: "pending",
      order_number: "",
    }).select().single();

    if (error || !order) { setBusy(false); toast.error(error?.message || "Gagal membuat pesanan"); return; }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      menu_item_id: i.id,
      item_name: i.name,
      unit_price: i.price,
      quantity: i.quantity,
      subtotal: i.price * i.quantity,
    }));
    const { error: oiErr } = await supabase.from("order_items").insert(orderItems);
    setBusy(false);
    if (oiErr) { toast.error(oiErr.message); return; }

    clear();
    toast.success(`Pesanan ${order.order_number} berhasil dibuat!`);
    navigate({ to: "/orders/$id", params: { id: order.id } });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold mb-8">Checkout</h1>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Section title="Data Pemesan">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Nama</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>No. WhatsApp</Label><Input required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
          </Section>

          <Section title="Metode Pengiriman">
            <RadioGroup value={delivery} onValueChange={(v) => setDelivery(v as "delivery" | "pickup")} className="grid gap-3 sm:grid-cols-2">
              <OptionCard checked={delivery === "delivery"} value="delivery" icon={Truck} title="Antar (Lokal)" desc={`Ongkir ${formatRupiah(DELIVERY_FEE)}`} />
              <OptionCard checked={delivery === "pickup"} value="pickup" icon={Store} title="Pickup" desc="Ambil di outlet, gratis" />
            </RadioGroup>
            {delivery === "delivery" && (
              <div className="mt-4">
                <Label>Alamat lengkap</Label>
                <Textarea required value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
              </div>
            )}
          </Section>

          <Section title="Metode Pembayaran">
            <RadioGroup value={payment} onValueChange={(v) => setPayment(v as "transfer" | "cod")} className="grid gap-3 sm:grid-cols-2">
              <OptionCard checked={payment === "transfer"} value="transfer" icon={Banknote} title="Transfer Bank" desc="Konfirmasi manual setelah pesan" />
              <OptionCard checked={payment === "cod"} value="cod" icon={Wallet} title="COD / Bayar di Tempat" desc="Bayar saat terima/ambil" />
            </RadioGroup>
            {payment === "transfer" && (
              <div className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm">
                <div className="font-semibold">Rekening pembayaran:</div>
                <div className="mt-1 text-muted-foreground">BCA <span className="font-mono text-foreground">1234567890</span> a.n. Juragan Geprek</div>
                <div className="mt-2 text-xs text-muted-foreground">Setelah pesan, kirim bukti transfer ke WA <span className="text-primary font-semibold">0812-3456-7890</span></div>
              </div>
            )}
          </Section>

          <Section title="Catatan (opsional)">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Mis. tanpa cabai, jam acara, dll." />
          </Section>
        </div>

        <div className="h-fit rounded-2xl border border-border/60 bg-card p-6 shadow-card sticky top-24 space-y-4">
          <h3 className="font-display text-xl font-bold">Ringkasan Pesanan</h3>
          <div className="space-y-2 text-sm max-h-60 overflow-y-auto pr-1">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{i.name} × {i.quantity}</span>
                <span>{formatRupiah(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-border" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatRupiah(total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatRupiah(deliveryFee)}</span></div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between font-display text-lg font-bold">
            <span>Total</span><span className="text-primary">{formatRupiah(grandTotal)}</span>
          </div>
          <Button type="submit" disabled={busy} size="lg" className="w-full bg-gradient-hero text-primary-foreground shadow-warm">
            {busy ? "Memproses..." : "Buat Pesanan"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
      <h3 className="font-display text-lg font-bold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function OptionCard({ checked, value, icon: Icon, title, desc }: { checked: boolean; value: string; icon: React.ElementType; title: string; desc: string }) {
  return (
    <Label htmlFor={value} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition ${checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
      <RadioGroupItem value={value} id={value} className="mt-1" />
      <div className="flex-1">
        <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="font-semibold">{title}</span></div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </Label>
  );
}
