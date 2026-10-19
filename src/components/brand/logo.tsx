import { cn } from "@/lib/cn";

/**
 * Kalkan Digital wordmark.
 *
 * The official logo file was not provided with the project. Until it is added,
 * a text wordmark following the brand rules is rendered ("Kalkan" white/navy,
 * "Digital" brand blue). To use the official artwork, put the files in
 * /public/brand/ and set LOGO_FILES below — no other code needs to change.
 */
const LOGO_FILES: { onDark: string; onLight: string; width: number; height: number } | null = null;
// Example: { onDark: "/brand/kalkan-digital-dark.svg", onLight: "/brand/kalkan-digital-light.svg", width: 180, height: 40 }

export function Logo({
  variant = "onLight",
  className,
  size = "md",
}: {
  variant?: "onDark" | "onLight";
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (LOGO_FILES) {
    const h = size === "sm" ? 24 : size === "lg" ? 40 : 32;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={variant === "onDark" ? LOGO_FILES.onDark : LOGO_FILES.onLight}
        alt="Kalkan Digital"
        height={h}
        width={Math.round((LOGO_FILES.width / LOGO_FILES.height) * h)}
        className={className}
      />
    );
  }
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";
  return (
    <span className={cn("inline-flex items-baseline font-display font-extrabold tracking-tight", text, className)} aria-label="Kalkan Digital">
      <span className={variant === "onDark" ? "text-white" : "text-navy-900"}>Kalkan</span>
      <span className="ml-[0.18em] text-brand-600">Digital</span>
    </span>
  );
}
