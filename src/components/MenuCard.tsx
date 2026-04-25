import { Plus, Flame, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";

export interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  is_available: boolean;
  is_catering_package: boolean;
  min_porsi: number;
}

export function MenuCard({ item }: { item: MenuItemRow }) {
  const { addItem } = useCart();
  const soldOut = !item.is_available || item.stock <= 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:shadow-warm hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-warm">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Flame className="h-16 w-16 text-primary/30" />
          </div>
        )}
        {item.is_catering_package && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground shadow-warm">
            <Users className="mr-1 h-3 w-3" /> Catering
          </Badge>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <span className="text-sm font-semibold text-destructive">Habis</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-bold leading-tight text-foreground">{item.name}</h3>
        {item.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        {item.is_catering_package && (
          <p className="mt-2 text-xs font-medium text-accent-foreground/80">Min. {item.min_porsi} porsi</p>
        )}

        <div className="mt-auto pt-4 flex items-end justify-between gap-2">
          <div>
            <div className="text-xs text-muted-foreground">Harga</div>
            <div className="font-display text-xl font-bold text-primary">{formatRupiah(item.price)}</div>
          </div>
          <Button
            size="sm"
            disabled={soldOut}
            onClick={() => {
              addItem({
                id: item.id,
                name: item.name,
                price: item.price,
                image_url: item.image_url,
                is_catering_package: item.is_catering_package,
                min_porsi: item.min_porsi,
              });
              toast.success(`${item.name} ditambahkan ke keranjang`);
            }}
            className="bg-gradient-hero text-primary-foreground shadow-warm hover:opacity-90"
          >
            <Plus className="mr-1 h-4 w-4" /> Tambah
          </Button>
        </div>
      </div>
    </div>
  );
}
