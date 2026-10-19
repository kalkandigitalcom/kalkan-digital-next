"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./toast";

const MESSAGES: Record<string, string> = {
  created: "Kayıt oluşturuldu.",
  updated: "Değişiklikler kaydedildi.",
  deleted: "Kayıt silindi.",
  archived: "Kayıt arşivlendi.",
  converted: "Teklif müşteri ve projeye dönüştürüldü.",
};

/** Shows a toast for ?flash=<code> after a redirect, then removes the param. */
export function Flash() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useToast();
  const code = params.get("flash");
  useEffect(() => {
    if (!code) return;
    const msg = MESSAGES[code];
    if (msg) push("success", msg);
    const sp = new URLSearchParams(params.toString());
    sp.delete("flash");
    const q = sp.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [code, params, pathname, push, router]);
  return null;
}
