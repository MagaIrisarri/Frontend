import { Star } from 'lucide-react';

// R-27: estrellas de la valoración; con onPick son botones (valorar), sin él solo muestran la que quedó.
export function Stars({ value, onPick, busy }: { value: number; onPick?: (n: number) => void; busy?: boolean }) {
  const n5 = [1, 2, 3, 4, 5];
  if (!onPick) return (
    <span className="stars" role="img" aria-label={`${value} de 5`}>
      {n5.map((n) => <Star key={n} className={`i sm${n <= value ? ' on' : ''}`} aria-hidden="true" />)}
    </span>
  );
  return (
    <span className="stars pick" role="group" aria-label="Valorar la estadía">
      {n5.map((n) => (
        <button key={n} type="button" className="icon-btn" aria-label={`Valorar con ${n} de 5`} disabled={busy} onClick={() => onPick(n)}>
          <Star className="i" aria-hidden="true" />
        </button>
      ))}
    </span>
  );
}
