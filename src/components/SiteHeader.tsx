import { Link } from "@tanstack/react-router";
import { Flame, ShoppingCart, User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const { settings } = useSiteSettings();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-warm transition-transform group-hover:scale-110">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-bold text-foreground">{settings.brand_name}</div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-semibold">{settings.brand_tagline}</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <Link to="/" activeProps={{ className: "text-primary" }} className="hover:text-primary transition">Beranda</Link>
          <Link to="/menu" activeProps={{ className: "text-primary" }} className="hover:text-primary transition">Menu</Link>
          <Link to="/catering" activeProps={{ className: "text-primary" }} className="hover:text-primary transition">Paket Catering</Link>
          <Link to="/contact" activeProps={{ className: "text-primary" }} className="hover:text-primary transition">Kontak</Link>
          {user && (
            <Link to="/orders" activeProps={{ className: "text-primary" }} className="hover:text-primary transition">Pesanan Saya</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/orders">Pesanan Saya</Link></DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="bg-gradient-hero text-primary-foreground shadow-warm hover:opacity-90">
              <Link to="/auth">Masuk</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
