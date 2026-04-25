import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Flame, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Dashboard Admin — Juragan Geprek" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth", search: { redirect: "/admin" } });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  if (!user || !isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero shadow-warm">
          <Flame className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-xs text-muted-foreground">Juragan Geprek E-Catering</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <NavItem to="/admin" icon={LayoutDashboard} label="Ringkasan" />
          <NavItem to="/admin/orders" icon={ClipboardList} label="Pesanan" />
          <NavItem to="/admin/menu" icon={UtensilsCrossed} label="Menu & Inventaris" />
          <NavItem to="/admin/settings" icon={Settings} label="Pengaturan Situs" />
        </aside>
        <div><Outlet /></div>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      activeProps={{ className: "bg-primary text-primary-foreground shadow-warm" }}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-secondary transition"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
