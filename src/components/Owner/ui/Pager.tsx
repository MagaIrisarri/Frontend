import { ChevronLeft, ChevronRight } from 'lucide-react';

// Paginador de una lista cargada por páginas: "26–50 de 120" y anterior / siguiente. No aparece si todo entra en una página.
export function Pager({ page, limit, total, busy, onPage }: { page: number; limit: number; total: number; busy?: boolean; onPage: (n: number) => void }) {
  if (total <= limit) return null;
  const last = Math.ceil(total / limit);
  return (
    <nav className="pager" aria-label="Paginación">
      <span className="ctx" aria-live="polite">{(page - 1) * limit + 1}–{Math.min(total, page * limit)} de {total}</span>
      <div className="pgbtns">
        <button type="button" className="icon-btn" aria-label="Página anterior" disabled={page <= 1 || busy} onClick={() => onPage(page - 1)}><ChevronLeft className="i" /></button>
        <button type="button" className="icon-btn" aria-label="Página siguiente" disabled={page >= last || busy} onClick={() => onPage(page + 1)}><ChevronRight className="i" /></button>
      </div>
    </nav>
  );
}
