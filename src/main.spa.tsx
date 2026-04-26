// SPA entry point — dipakai oleh vite.config.spa.ts (build untuk VPS/Vercel).
// File ini TIDAK dipakai oleh Lovable (Lovable pakai SSR via __root.tsx).
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getRouter } from "./router";
import { AuthProvider } from "./hooks/useAuth";
import { CartProvider } from "./hooks/useCart";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { Toaster } from "./components/ui/sonner";
import "./styles.css";

const router = getRouter();
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
              <RouterProvider router={router} />
            </main>
            <SiteFooter />
          </div>
          <Toaster richColors position="top-center" />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
