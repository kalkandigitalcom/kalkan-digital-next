import { cn } from "@/lib/cn";

/**
 * Kalkan Digital logosu.
 *
 * Resmî logo: public/brand/logo.png (1680×330, şeffaf PNG). "Kalkan" beyaz,
 * "Digital" mavi olduğu için koyu zeminlerde (onDark) doğrudan kullanılır.
 * Açık zeminler (onLight) için aynı görselin "Kalkan" kısmı marka laciverti
 * (#0B1F3A) yapılmış sürümü: public/brand/logo-on-light.png — marka kuralı
 * ("Kalkan" beyaz/lacivert, "Digital" mavi) ile aynı.
 * public/ klasörü sitenin köküne sunulur → yollar "/brand/..." biçimindedir.
 * LOGO_FILES null yapılırsa metin wordmark'a geri dönülür.
 */
const LOGO_FILES: { onDark: string; onLight: string; width: number; height: number } | null = {
  onDark: "/brand/logo.png",
  onLight: "/brand/logo-on-light.png",
  width: 1680,
  height: 330,
};

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
