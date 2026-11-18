export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p style={{ marginTop: 8, color: "var(--color-text-muted)" }}>
        Цей розділ зробимо пізніше.
      </p>
    </div>
  );
}