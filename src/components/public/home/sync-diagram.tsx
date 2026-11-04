import { CalendarDays, Globe } from "lucide-react";

/**
 * Two-way calendar sync explained as a diagram (server component).
 *
 * States only the confirmed behaviour: bookings on the villa site reach the Airbnb and Booking.com
 * calendars, bookings on those platforms reach the site's availability calendar. No timing,
 * frequency claims. Other platforms are shown only as custom development, never as ready. The moving dots are decoration (CSS only, hidden from
 * assistive tech, static with reduced motion).
 */
export function SyncDiagram() {
  return (
    <figure className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-8">
      <div className="grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] md:gap-6">
        <div className="rounded-2xl border border-white/10 bg-navy-900 p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-aqua-400/15 text-aqua-300">
            <Globe className="size-5" aria-hidden />
          </span>
          <p className="mt-4 font-display text-base font-bold text-white">Villa siteniz</p>
          <p className="mt-1 text-sm text-navy-300">Müsaitlik takvimi</p>
        </div>

        <div className="grid gap-3 md:gap-4">
          <Lane direction="forward" label="Sitenizdeki rezervasyon" target="platform takvimlerine yansır" />
          <Lane direction="back" label="Platformdaki rezervasyon" target="sitenizin müsaitlik takvimine yansır" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-navy-900 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-aqua-400/15 text-aqua-300">
              <CalendarDays className="size-5" aria-hidden />
            </span>
            <span className="rounded-full bg-aqua-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-aqua-300">Hazır</span>
          </div>
          <p className="mt-4 font-display text-base font-bold text-white">Airbnb ve Booking.com</p>
          <p className="mt-1 text-sm text-navy-300">Platform takvimleri</p>
        </div>
      </div>
      <figcaption className="mt-6 border-t border-white/10 pt-5 text-sm leading-relaxed text-navy-200">
        <p className="font-semibold text-white">Airbnb, Booking.com ve ihtiyaçlarınıza uygun diğer rezervasyon platformlarıyla takvim entegrasyonu.</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-aqua-300/25 bg-aqua-400/[0.07] p-4">
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-aqua-300">Hazır</dt>
            <dd className="mt-1.5">Airbnb ve Booking.com ile çift yönlü takvim eşitleme. Farklı kanallardan gelen rezervasyonları birlikte yönetmenizi sağlar ve <strong className="font-semibold text-white">çifte rezervasyon riskini azaltır.</strong></dd>
          </div>
          <div className="rounded-xl border border-dashed border-white/20 p-4">
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-navy-300">Projenize özel geliştirilir</dt>
            <dd className="mt-1.5">Diğer rezervasyon platformları ve yerel firmalarla takvim entegrasyonu, ihtiyacınıza göre ayrıca geliştirilir.</dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}

function Lane({ direction, label, target }: { direction: "forward" | "back"; label: string; target: string }) {
  const forward = direction === "forward";
  return (
    <div className="rounded-2xl border border-aqua-300/20 bg-aqua-400/[0.06] p-4">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-navy-200">{target}</p>
      <div aria-hidden className="sync-track relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <span className={`sync-run absolute inset-0 ${forward ? "" : "sync-back"}`}>
          <span className={`absolute top-0 h-full w-10 rounded-full bg-gradient-to-r ${forward ? "right-0 from-transparent to-aqua-300" : "left-0 from-aqua-300 to-transparent"}`} />
        </span>
      </div>
    </div>
  );
}
