"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-card">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <h1 className="font-display text-lg font-semibold text-navy-900">Bir hata oluştu</h1>
      <p className="mt-2 text-sm text-navy-500">Sayfa yüklenirken beklenmeyen bir sorun oluştu. Veritabanı bağlantısını kontrol edip tekrar deneyin.</p>
      {error.digest ? <p className="mt-2 font-mono text-[11px] text-navy-400">Hata kodu: {error.digest}</p> : null}
      <Button className="mt-6" onClick={reset}>
        Tekrar dene
      </Button>
    </div>
  );
}
