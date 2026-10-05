"use client";

export const PAGE_SIZE = 10;

interface Props {
  total: number;
  page: number;
  onPage: (p: number) => void;
  pageSize?: number;
}

/** Range text + numbered pages, used under every admin table. */
export function Pager({ total, page, onPage, pageSize = PAGE_SIZE }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const first = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, total);
  return (
    <div className="pager">
      <span>
        {first}–{last} de {total}
      </span>
      <div className="pager-pages">
        <button type="button" onClick={() => onPage(current - 1)} disabled={current <= 1} aria-label="Página anterior">←</button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button key={p} type="button" className={p === current ? "is-on" : ""} onClick={() => onPage(p)} aria-current={p === current ? "page" : undefined}>
            {p}
          </button>
        ))}
        <button type="button" onClick={() => onPage(current + 1)} disabled={current >= pages} aria-label="Página siguiente">→</button>
      </div>
    </div>
  );
}

/** Slice helper shared by the lists. */
export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): { rows: T[]; current: number } {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  return { rows: items.slice((current - 1) * pageSize, current * pageSize), current };
}
