/** แสดงระหว่างหน้าใน (app) โหลดข้อมูลจาก API */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
