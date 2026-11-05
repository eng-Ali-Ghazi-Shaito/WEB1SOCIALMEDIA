export function RouteFallback({ label }: { label: string }) {
  return (
    <div aria-live="polite" className="route-fallback">
      <span className="spinner" />
      <span className="visually-hidden">Loading {label}…</span>
    </div>
  );
}
