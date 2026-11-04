/**
 * Home trust cards (server component, CSS-only effects; see `.trust-card` in globals.css).
 *
 * The client count is shown only once it has been verified. Until then the card uses a wording
 * without a number, so no unverified figure is published.
 */

/** Set to the verified number of clients (e.g. 45) to show "+N müşteri"; null keeps the wording without a number. */
const VERIFIED_CLIENT_COUNT: number | null = null;

interface TrustCard {
  /** Large figure, e.g. "8+" */
  figure?: string;
  /** Unit next to the figure, or the card title when there is no figure */
  label: string;
  text: string;
}

export function TrustCards({ years, foundedYear }: { years: number; foundedYear: number }) {
  const cards: TrustCard[] = [
    { figure: `${years}+`, label: "yıl", text: `${foundedYear}'den beri dijital projeler` },
    VERIFIED_CLIENT_COUNT
      ? { figure: `+${VERIFIED_CLIENT_COUNT}`, label: "müşteri", text: "İşletmeler için dijital çözümler" }
      : { label: "Farklı sektörlerden işletmeler", text: "İşletmeler için dijital çözümler" },
    { label: "Kaş · Kalkan · Fethiye", text: "Yerel ve bölgesel hizmet ağı" },
    { label: "Tek muhatap", text: "Tasarım, yazılım, hosting ve bakım" },
  ];

  return (
    <dl data-reveal="strip" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <div key={c.label} className="trust-card group">
          <span className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-navy-400" aria-hidden>
            <span className="size-1.5 rounded-full bg-aqua-500" />
            {String(i + 1).padStart(2, "0")}
          </span>
          <dt className="mt-5 flex min-h-14 items-end gap-2 lg:min-h-[4.5rem] font-display text-navy-900">
            {c.figure ? (
              <>
                <span className="trust-figure text-5xl font-extrabold leading-none tracking-tight sm:text-[3.4rem]">{c.figure}</span>
                <span className="pb-1 text-lg font-bold text-navy-700">{c.label}</span>
              </>
            ) : (
              <span className="text-2xl font-extrabold leading-tight tracking-tight">{c.label}</span>
            )}
          </dt>
          <dd className="mt-3 text-sm leading-relaxed text-navy-500">{c.text}</dd>
        </div>
      ))}
    </dl>
  );
}
