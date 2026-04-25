import type { Database } from "@/integrations/supabase/types";
import { Clock, CheckCircle2, ChefHat, PackageCheck, Truck, XCircle, type LucideIcon } from "lucide-react";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu Konfirmasi",
  confirmed: "Dikonfirmasi",
  preparing: "Sedang Disiapkan",
  ready: "Siap Diambil/Diantar",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_DESCRIPTION: Record<OrderStatus, string> = {
  pending: "Pesanan diterima, menunggu admin memverifikasi pembayaran/permintaan.",
  confirmed: "Pesanan dikonfirmasi & masuk antrian dapur.",
  preparing: "Tim dapur sedang menyiapkan pesananmu.",
  ready: "Pesanan siap. Menunggu kurir/pickup.",
  delivered: "Pesanan telah diterima. Selamat menikmati!",
  cancelled: "Pesanan dibatalkan.",
};

export const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "secondary",
  preparing: "secondary",
  ready: "default",
  delivered: "default",
  cancelled: "destructive",
};

export const STATUS_ICON: Record<OrderStatus, LucideIcon> = {
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  ready: PackageCheck,
  delivered: Truck,
  cancelled: XCircle,
};

export const STATUS_OPTIONS: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];

// Forward progression (excluding cancelled)
export const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivered"];
