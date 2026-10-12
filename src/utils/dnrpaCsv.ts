// CSV mensual de inscripciones del DNRPA (datos.gob.ar): de las ~45.000 filas solo interesan marca, modelo y tipo, y se repiten mucho.
export interface CatalogRow { brand: string; model: string; type: string }

export const MAX_CSV_BYTES = 25 * 1024 * 1024;
export const MAX_CATALOG_ITEMS = 5000; // el mismo tope que Catalog.Schema.ts del backend

const COLUMNS = { brand: 'automotor_marca_descripcion', model: 'automotor_modelo_descripcion', type: 'automotor_tipo_descripcion' } as const;

export class CsvError extends Error {}

// Lector CSV con campos entre comillas (RFC 4180): devuelve cada fila ya separada.
function* records(text: string): Generator<string[]> {
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (text[i + 1] === '"') { field += '"'; i++; }
      else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') yield row;
      row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); yield row; }
}

// Devuelve las combinaciones únicas de marca, modelo y tipo, y cuántas filas tenía el archivo.
export function parseDnrpaCsv(text: string): { rows: CatalogRow[]; total: number } {
  const lines = records(text.replace(/^﻿/, ''));
  const header = lines.next().value ?? [];
  const at = Object.fromEntries(Object.entries(COLUMNS).map(([k, name]) => [k, header.indexOf(name)])) as Record<keyof typeof COLUMNS, number>;
  const missing = Object.entries(COLUMNS).filter(([k]) => at[k as keyof typeof COLUMNS] < 0).map(([, name]) => name);
  if (missing.length) throw new CsvError(`El archivo no parece un CSV del DNRPA: faltan las columnas ${missing.join(', ')}. Descargalo de datos.gob.ar y probá de nuevo.`);

  const unique = new Map<string, CatalogRow>();
  let total = 0;
  for (const r of lines) {
    total++;
    const row = { brand: (r[at.brand] ?? '').trim(), model: (r[at.model] ?? '').trim(), type: (r[at.type] ?? '').trim() };
    if (row.brand && row.model) unique.set(`${row.brand}|${row.model}|${row.type}`, row);
  }
  if (!total) throw new CsvError('El archivo está vacío: no tiene filas de vehículos.');
  return { rows: [...unique.values()], total };
}
