import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ToastProvider } from "@/components/ui/toast";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="grid min-h-dvh lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-navy-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div aria-hidden className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-brand-600/25 blur-3xl" />
          <div aria-hidden className="absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-brand-500/10 blur-3xl" />
          <Logo variant="onDark" size="lg" className="relative" />
          <div className="relative max-w-md">
            <p className="font-display text-3xl font-bold leading-tight text-white">İşletme yönetim paneli</p>
            <p className="mt-3 text-sm leading-relaxed text-navy-200">
              Müşteriler, projeler, gelir-gider, yenilemeler ve teklifler tek bir güvenli panelde.
            </p>
          </div>
          <p className="relative text-xs text-navy-300">© {new Date().getFullYear()} Kalkan Digital · Yalnızca yetkili kullanıcılar</p>
        </aside>
        <main className="flex items-center justify-center bg-surface px-4 py-12 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Logo size="lg" />
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900">{title}</h1>
            <p className="mt-1 text-sm text-navy-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
