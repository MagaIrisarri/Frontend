import { useRef, useState, type ChangeEvent } from 'react';
import { AlertCircle, FileUp, RefreshCw } from 'lucide-react';
import { Empty, SkeletonRows } from '../Owner/ui/Page';
import { Field, apiError } from '../Owner/ui/Field';
import { useToast } from '../Owner/ui/Toasts';
import { useAuthStore } from '../../stores/authStore';
import { importCatalog, type CatalogImportResult } from '../../services/vehicle.service';
import { CsvError, MAX_CATALOG_ITEMS, MAX_CSV_BYTES, parseDnrpaCsv, type CatalogRow } from '../../utils/dnrpaCsv';
import { cap, plural } from '../../pages/Owner/owner.lib';

// Pestaña "Actualizar con CSV" de Marcas y modelos (RA-14 a RA-17): el navegador lee el CSV del DNRPA, el servidor cuenta qué falta (dryRun)
// y recién al confirmar agrega. Nunca borra ni edita lo existente.
export default function CatalogImport({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const me = useAuthStore(s => s.user);
  const userId = String(me?.id || me?._id || '');
  const [read, setRead] = useState<{ rows: CatalogRow[]; total: number } | null>(null);
  const [preview, setPreview] = useState<CatalogImportResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'working' | 'ready' | 'saving'>('idle');
  const [fileError, setFileError] = useState('');
  const [netError, setNetError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const reset = () => { setRead(null); setPreview(null); setStatus('idle'); setFileError(''); setNetError(''); if (input.current) input.current.value = ''; };

  const check = async (data: { rows: CatalogRow[]; total: number }) => {
    setStatus('working'); setNetError('');
    try { setPreview(await importCatalog(data.rows, true, userId)); setStatus('ready'); }
    catch (x) { setNetError(apiError(x, 'No pudimos revisar el archivo. Revisá tu conexión e intentá de nuevo.')); setStatus('idle'); }
  };

  const choose = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    reset(); setStatus('working');
    try {
      if (file.size > MAX_CSV_BYTES) throw new CsvError('El archivo pesa más de 25 MB. Usá el CSV mensual de inscripciones iniciales del DNRPA.');
      const data = parseDnrpaCsv(await file.text());
      if (data.rows.length > MAX_CATALOG_ITEMS) throw new CsvError(`El archivo tiene ${data.rows.length} combinaciones de marca y modelo y el máximo es ${MAX_CATALOG_ITEMS}.`);
      setRead(data);
      await check(data);
    } catch (x) {
      setFileError(x instanceof CsvError ? x.message : 'No pudimos leer el archivo. Probá con otro CSV.');
      setStatus('idle');
    }
  };

  const confirm = async () => {
    if (!read) return;
    setStatus('saving');
    try {
      const done = await importCatalog(read.rows, false, userId);
      toast(`Se agregaron ${plural(done.modelsNew, 'modelo', 'modelos')} y ${plural(done.brandsNew, 'marca', 'marcas')}.`);
      reset();
      onDone();
    } catch (x) {
      toast(apiError(x, 'No se pudo actualizar el catálogo. Intentá de nuevo.'), 'err');
      setStatus('ready');
    }
  };

  const busy = status === 'working' || status === 'saving';
  const pending = preview ? preview.modelsNew + preview.reactivated : 0;

  return (
    <section className="panel" style={{ padding: 24, display: 'grid', gap: 16 }}>
      <div className="fs"><div className="fh"><h3>Archivo del DNRPA</h3></div>
        <p className="ad">Descargá el CSV mensual de inscripciones iniciales de datos.gob.ar y elegilo acá. Solo se agregan las marcas y modelos que todavía no están; no se borra ni se cambia nada de lo existente.</p>
        <Field label="Archivo CSV" error={fileError} hint="Hasta 25 MB. Usa las columnas de marca, modelo y tipo de automotor.">
          {(id, aria) => <input ref={input} className="inp" id={id} type="file" accept=".csv,text/csv" disabled={busy} onChange={choose} {...aria} />}
        </Field>
      </div>

      {status === 'working' && <div role="status" aria-label="Revisando el archivo"><SkeletonRows n={3} cols={3} /></div>}

      {netError && (
        <div className="panel empty errbox" role="alert">
          <div className="ico"><AlertCircle className="i" /></div>
          <h3>No pudimos revisar el archivo</h3>
          <p>{netError}</p>
          {read && <button type="button" className="btn" onClick={() => check(read)}><RefreshCw className="i sm" />Reintentar</button>}
        </div>
      )}

      {!read && !fileError && status === 'idle' && !netError && (
        <Empty icon={<FileUp className="i" />} title="Todavía no elegiste un archivo">Elegí el CSV para ver qué marcas y modelos se agregarían antes de confirmar.</Empty>
      )}

      {preview && read && (status === 'ready' || status === 'saving') && (
        <div className="fs" aria-live="polite"><div className="fh"><h3>Vista previa</h3></div>
          <dl className="dl" style={{ margin: 0 }}>
            <dt>Filas leídas</dt><dd>{read.total.toLocaleString('es-AR')}</dd>
            <dt>Combinaciones únicas</dt><dd>{preview.unique.toLocaleString('es-AR')}</dd>
            <dt>Marcas nuevas</dt><dd>{preview.brandsNew}</dd>
            <dt>Modelos nuevos</dt><dd>{preview.modelsNew}</dd>
            <dt>Para reactivar</dt><dd>{preview.reactivated}</dd>
            <dt>Ya existían</dt><dd>{preview.existing.toLocaleString('es-AR')}</dd>
            <dt>Omitidos</dt><dd>{preview.skipped.toLocaleString('es-AR')} (acoplados, tractores, chasis, ómnibus y nombres demasiado cortos)</dd>
          </dl>
          {preview.sample.length > 0 && (
            <div className="panel tw"><table className="tbl">
              <thead><tr><th>Marca</th><th>Modelo</th><th>Tipo</th></tr></thead>
              <tbody>{preview.sample.map(s => <tr key={`${s.brand}|${s.model}`}><td className="nm" data-label="Marca">{s.brand}</td><td data-label="Modelo">{s.model}</td><td data-label="Tipo">{cap(s.type.toLowerCase())}</td></tr>)}</tbody>
            </table></div>
          )}
          {preview.modelsNew > preview.sample.length && <p className="ad">Se muestran los primeros {preview.sample.length} de {preview.modelsNew} modelos nuevos.</p>}
          {pending === 0
            ? <p className="ctx">El catálogo ya está al día: no hay nada para agregar.</p>
            : <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" className="btn" onClick={reset} disabled={busy}>Descartar</button>
                <button type="button" className="btn pri" onClick={confirm} aria-busy={status === 'saving'} disabled={busy}>
                  {preview.modelsNew ? `Agregar ${plural(preview.modelsNew, 'modelo', 'modelos')}` : 'Reactivar'}
                </button>
              </div>}
        </div>
      )}
    </section>
  );
}
