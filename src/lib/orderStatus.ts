import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu Konfirmasi",
  confirmed: "Dikonfirmasi",
  preparing: "Sedang Disiapkan",
  ready: "Siap Diambil/Diantar",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "secondary",
  preparing: "secondary",
  ready: "default",
  delivered: "default",
  cancelled: "destructive",
};

export const STATUS_OPTIONS: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];
