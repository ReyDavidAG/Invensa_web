// Shared design tokens for transactional emails.
// Mirrors design.md (Taller variant): cobalt primary, warm cream paper,
// amber warning, red destructive. Inline HTML uses these directly —
// no class-based CSS since most email clients strip <style> blocks.

export const emailTokens = {
  // Surfaces
  paper: "#faf9f6", // warm cream app canvas
  card: "#ffffff", // card on cream
  border: "#e7e5e4", // hairline border
  borderStrong: "#d6d3d1",
  muted: "#f5f5f4", // hover / faint fills

  // Text
  text: "#1c1917", // primary text
  mutedText: "#78716c", // helper / caption
  faintText: "#a8a29e", // disabled / meta

  // Brand
  cobalt: "#2563eb", // primary action / accent
  cobaltDark: "#1d4ed8", // hover state

  // Status
  success: "#15803d",
  successBg: "#dcfce7",
  warning: "#b45309", // amber-700 for AAA contrast on cream
  warningBg: "#fef3c7",
  destructive: "#b91c1c", // red-700 for AAA contrast
  destructiveBg: "#fee2e2",
} as const;

// Responsive max-width for email body.
export const EMAIL_MAX_WIDTH = 600;
