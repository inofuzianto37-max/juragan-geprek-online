import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Masuk — Juragan Geprek" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectTo = search.redirect || "/";

  useEffect(() => {
    if (!loading && user) navigate({ to: redirectTo });
  }, [user, loading, navigate, redirectTo]);

  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero shadow-warm">
            <Flame className="h-7 w-7 text-primary-foreground" />
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold">Selamat datang</h1>
          <p className="text-muted-foreground text-sm mt-1">Masuk atau daftar untuk pesan & lihat riwayat</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="signup"><SignupForm /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Berhasil masuk!");
  };

  return (
    <form onSubmit={submit} className="space-y-4 mt-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@email.com" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-hero text-primary-foreground shadow-warm">
        {busy ? "Memproses..." : "Masuk"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Akun admin? Login dengan email <code className="text-primary">admingeprek@juragan.local</code>
      </p>
    </form>
  );
}

function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password minimal 6 karakter"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, phone, address },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Akun berhasil dibuat!");
  };

  return (
    <form onSubmit={submit} className="space-y-3 mt-4">
      <div>
        <Label htmlFor="name">Nama lengkap</Label>
        <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="phone">No. WhatsApp</Label>
        <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx" />
      </div>
      <div>
        <Label htmlFor="address">Alamat</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Untuk pengiriman" />
      </div>
      <div>
        <Label htmlFor="email-s">Email</Label>
        <Input id="email-s" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="password-s">Password (min. 6 karakter)</Label>
        <Input id="password-s" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-hero text-primary-foreground shadow-warm">
        {busy ? "Memproses..." : "Daftar"}
      </Button>
    </form>
  );
}
