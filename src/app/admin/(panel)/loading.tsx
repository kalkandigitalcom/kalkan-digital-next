export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Yükleniyor">
      <div className="h-8 w-56 rounded-lg bg-navy-100" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white shadow-card" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-white shadow-card" />
    </div>
  );
}
