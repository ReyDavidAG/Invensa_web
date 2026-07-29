/* Hallmark · locked system applied (Taller) · src/components/brand-mark.tsx
 * Brand mark — receipt with folded corner.
 *
 * Design: a stylized POS receipt with the top-right corner folded back
 * (showing the underside), one item line, and one thicker total bar.
 * Single path with fill-rule="evenodd" so the receipt body fills with
 * currentColor and the fold + lines are transparent cutouts.
 *
 * The folded corner is the signature move: it signals "freshly printed"
 * rather than a generic stock receipt icon. The single item line + total
 * bar are enough texture to read as "transaction" at any size without
 * becoming visual noise.
 *
 * Tokens: fill=currentColor (theme-aware). Works over the cobalt sidebar
 * tile (white) and as a browser favicon (page text colour).
 */

import type { SVGProps } from "react";

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M5 4 H22 L28 10 V25 a2 2 0 0 1-2 2 H7 a2 2 0 0 1-2-2 Z M22 4 L28 10 L22 10 Z M9 14 h11 v1.5 h-11 z M9 22 h15 v2 h-15 z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
