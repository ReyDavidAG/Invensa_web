// Auth route group layout. Just a passthrough — AuthShell lives on each page so
// the per-page eyebrow / heading can vary.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
