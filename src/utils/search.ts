// Búsqueda de texto: ignora tildes y mayúsculas y exige todas las palabras ("centro belgrano" encuentra Belgrano 500, Centro).
export const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function matchesQuery(query: string, ...fields: unknown[]): boolean {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = norm(fields.filter(Boolean).join(' '));
  return words.every((w) => hay.includes(w));
}
