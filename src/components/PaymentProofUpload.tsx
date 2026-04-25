import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle2, Loader2, ImageIcon, RefreshCw, XCircle, FileImage } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Props {
  orderId: string;
  orderNumber: string;
  existingPath: string | null;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type UploadState =
  | { kind: "idle" }
  | { kind: "selected"; file: File; previewUrl: string }
  | { kind: "uploading"; file: File; previewUrl: string; progress: number }
  | { kind: "success"; file: File }
  | { kind: "error"; message: string };

export function PaymentProofUpload({ orderId, orderNumber, existingPath }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadPreview = async (path: string) => {
    setLoadingPreview(true);
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60 * 10);
    setLoadingPreview(false);
    if (error) { toast.error("Gagal memuat pratinjau"); return; }
    setSignedUrl(data.signedUrl);
  };

  const pickFile = (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      setState({ kind: "error", message: "Format tidak didukung. Gunakan JPG, PNG, atau WebP." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({ kind: "error", message: "Ukuran file maksimal 5 MB." });
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setState({ kind: "selected", file, previewUrl });
  };

  const startUpload = async () => {
    if (state.kind !== "selected" || !user) return;
    const { file, previewUrl } = state;
    setState({ kind: "uploading", file, previewUrl, progress: 5 });

    // Simulate progress steps (Supabase JS SDK doesn't expose XHR progress)
    const tick = setInterval(() => {
      setState((s) => (s.kind === "uploading" && s.progress < 85
        ? { ...s, progress: s.progress + 10 }
        : s));
    }, 250);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${orderId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (upErr) {
      clearInterval(tick);
      setState({ kind: "error", message: upErr.message });
      toast.error("Upload gagal: " + upErr.message);
      return;
    }

    setState((s) => s.kind === "uploading" ? { ...s, progress: 95 } : s);

    const { error: dbErr } = await supabase
      .from("orders")
      .update({ payment_proof_url: path })
      .eq("id", orderId);

    clearInterval(tick);

    if (dbErr) {
      setState({ kind: "error", message: dbErr.message });
      toast.error("Gagal menyimpan: " + dbErr.message);
      return;
    }

    setState({ kind: "success", file });
    setSignedUrl(null);
    toast.success(`Bukti bayar untuk ${orderNumber} berhasil dikirim`);
    qc.invalidateQueries({ queryKey: ["order", orderId] });
  };

  const reset = () => {
    if (state.kind === "selected" || state.kind === "uploading") {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const triggerPick = () => inputRef.current?.click();

  // Hidden file input shared by all UI states
  const FileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED.join(",")}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) pickFile(f);
      }}
    />
  );

  return (
    <div className="space-y-3">
      {FileInput}

      {/* PRE-SELECT or RESET */}
      {state.kind === "idle" && !existingPath && (
        <button
          type="button"
          onClick={triggerPick}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/50 p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
        >
          <Upload className="h-6 w-6 text-primary" />
          <div className="text-sm font-semibold">Pilih file bukti transfer</div>
          <div className="text-xs text-muted-foreground">JPG / PNG / WebP, maks 5 MB</div>
        </button>
      )}

      {/* SELECTED — confirm before upload */}
      {state.kind === "selected" && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <img src={state.previewUrl} alt="Pratinjau" className="h-20 w-20 rounded-lg object-cover border border-border" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileImage className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{state.file.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {(state.file.size / 1024).toFixed(0)} KB · siap diunggah
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={startUpload} className="bg-gradient-hero text-primary-foreground shadow-warm">
              <Upload className="mr-1 h-4 w-4" /> Unggah sekarang
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={reset}>
              Ganti file
            </Button>
          </div>
        </div>
      )}

      {/* UPLOADING — show progress */}
      {state.kind === "uploading" && (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <img src={state.previewUrl} alt="Pratinjau" className="h-20 w-20 rounded-lg object-cover border border-border" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                <span className="truncate">Mengunggah {state.file.name}…</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Mohon tunggu, jangan tutup halaman.</div>
            </div>
          </div>
          <Progress value={state.progress} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">{state.progress}%</div>
        </div>
      )}

      {/* ERROR */}
      {state.kind === "error" && (
        <div className="rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm font-semibold text-destructive">
            <XCircle className="h-5 w-5 shrink-0" />
            <div>
              <div>Upload gagal</div>
              <div className="text-xs font-normal text-destructive/80 mt-1">{state.message}</div>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            Coba lagi
          </Button>
        </div>
      )}

      {/* EXISTING PROOF (success state shows same UI by virtue of existingPath now being set) */}
      {(existingPath || state.kind === "success") && state.kind !== "selected" && state.kind !== "uploading" && state.kind !== "error" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 className="h-5 w-5" />
            Bukti pembayaran berhasil dikirim
          </div>
          <div className="text-xs text-muted-foreground">
            Tim kami akan memverifikasi bukti pembayaranmu sebelum pesanan diproses.
          </div>
          <div className="flex flex-wrap gap-2">
            {existingPath && (
              <Button type="button" size="sm" variant="outline" onClick={() => loadPreview(existingPath)} disabled={loadingPreview}>
                {loadingPreview ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-1 h-4 w-4" />}
                Lihat bukti
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={triggerPick}>
              <RefreshCw className="mr-1 h-4 w-4" /> Ganti bukti
            </Button>
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
      )}
    </div>
  );
}
