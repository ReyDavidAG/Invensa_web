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
