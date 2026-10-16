import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface FilterBarProps {
  search?: { value: string; onChange: (v: string) => void; label: string; placeholder: string };
  children?: ReactNode; // controles de filtro: .seg, select.sel, Field…
  active: boolean; // hay algún filtro aplicado
  onClear: () => void;
}

// Barra de filtros de un panel: búsqueda opcional, controles y "Limpiar filtros" cuando hay algo aplicado.
// Toda lista filtrable usa esta barra y, si no queda nada, el estado "sin resultados" con la misma acción.
export function FilterBar({ search, children, active, onClear }: FilterBarProps) {
  return (
    <div className="ftool" role="group" aria-label="Filtros">
      {search && (
        <div className="search">
          <Search className="i" aria-hidden="true" />
          <input type="search" className="inp" aria-label={search.label} placeholder={search.placeholder} value={search.value} onChange={(e) => search.onChange(e.target.value)} />
        </div>
      )}
      {(children || active) && (
        <div className="frow">
          {children}
          {active && <button type="button" className="btn ghost sm fclear" onClick={onClear}>Limpiar filtros</button>}
        </div>
      )}
    </div>
  );
}
