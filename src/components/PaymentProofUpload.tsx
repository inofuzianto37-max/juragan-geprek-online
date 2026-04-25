import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle2, Loader2, ImageIcon, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  orderId: string;
  orderNumber: string;
  existingPath: string | null;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function PaymentProofUpload({ orderId, orderNumber, existingPath }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadPreview = async (path: string) => {
    setLoadingPreview(true);
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60 * 10);
    setLoadingPreview(false);
    if (error) { toast.error("Gagal memuat pratinjau"); return; }
    setSignedUrl(data.signedUrl);
  };

  const handleFile = async (file: File) => {
    if (!user) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Ukuran file maksimal 5 MB.");
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${orderId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) { setBusy(false); toast.error(upErr.message); return; }

    const { error: dbErr } = await supabase
      .from("orders")
      .update({ payment_proof_url: path })
      .eq("id", orderId);
    if (dbErr) { setBusy(false); toast.error(dbErr.message); return; }

    setBusy(false);
    setSignedUrl(null);
    toast.success(`Bukti bayar untuk ${orderNumber} terkirim`);
    qc.invalidateQueries({ queryKey: ["order", orderId] });
  };

  return (
    <div className="space-y-3">
      {existingPath ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> Bukti pembayaran sudah dikirim
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => loadPreview(existingPath)}
              disabled={loadingPreview}
            >
              {loadingPreview ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-1 h-4 w-4" />}
              Lihat bukti
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept={ACCEPTED.join(",")}
                className="hidden"
                disabled={busy}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Button type="button" size="sm" variant="outline" disabled={busy} asChild>
                <span className="cursor-pointer">
                  {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
                  Ganti bukti
                </span>
              </Button>
            </label>
          </div>
          {signedUrl && (
            <a href={signedUrl} target="_blank" rel="noreferrer" className="block">
              <img
                src={signedUrl}
                alt="Bukti pembayaran"
                className="max-h-80 w-auto rounded-xl border border-border/60 object-contain bg-muted"
              />
            </a>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/50 p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
          <input
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {busy ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="text-sm font-medium">Mengunggah...</div>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-primary" />
              <div className="text-sm font-semibold">Unggah bukti transfer</div>
              <div className="text-xs text-muted-foreground">JPG / PNG / WebP, maks 5 MB</div>
            </>
          )}
        </label>
      )}
    </div>
  );
}
