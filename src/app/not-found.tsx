import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-4">
      <div className="text-center">
        <p className="font-display text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-navy-900">Sayfa bulunamadı</h1>
        <p className="mt-2 text-navy-500">Aradığınız sayfa taşınmış veya kaldırılmış olabilir.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-bold text-white hover:bg-brand-700">Ana sayfaya dön</Link>
      </div>
    </main>
  );
}
