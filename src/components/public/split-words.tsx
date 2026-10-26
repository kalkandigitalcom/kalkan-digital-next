import type { CSSProperties, ReactNode } from "react";

/**
 * Word-by-word heading animation markup (server component, no JavaScript).
 *
 * Each word is wrapped in a clipping span (`.sw`) with an inner span (`.sw-i`) that the CSS motion
 * layer slides up from below the line. Spaces stay as real text between the wrappers, so line
 * breaking, copy/paste, search engines and screen readers see the original text unchanged.
 * Without animation (reduced motion, finished, or no supporting CSS) the spans render as plain text.
 *
 * `start` offsets the word index, so several SplitWords in one heading continue one rhythm.
 */
export function SplitWords({ text, start = 0 }: { text: string; start?: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <Word key={`${i}-${w}`} index={start + i}>
          {w}
        </Word>
      ))}
    </>
  );
}

/** One animated unit (a word, or a styled phrase that must move as one piece). */
export function Word({ index, children, className }: { index: number; children: ReactNode; className?: string }) {
  return (
    <>
      <span className="sw" style={{ "--w": index } as CSSProperties}>
        <span className={className ? `sw-i ${className}` : "sw-i"}>{children}</span>
      </span>{" "}
    </>
  );
}
