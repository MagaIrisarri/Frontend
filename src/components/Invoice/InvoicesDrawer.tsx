import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, FileText, SearchX } from 'lucide-react';
import { getInvoicesByClientId } from '../../services/invoice.service';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Drawer } from '../Owner/ui/Layer';
import OwnerShell from '../Owner/ui/OwnerShell';
import { Presence } from '../Owner/ui/Presence';
import { Empty, ErrorBox } from '../Owner/ui/Page';
import { money, cap } from '../../pages/Owner/owner.lib';
import { FilterBar } from '../Owner/ui/FilterBar';
import { matchesQuery } from '../../utils/search';
import { PERIODS, inPeriod, type Period } from '../../utils/period';

interface InvoicesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Facturación y pagos como panel lateral (sirve igual en celular y tablet).
export function InvoicesDrawer({ isOpen, onClose }: InvoicesDrawerProps) {
  return (
    <Presence open={isOpen}>
      <OwnerShell bare>
        <Content onClose={onClose} />
      </OwnerShell>
    </Presence>
  );
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-AR');
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function Content({ onClose }: { onClose: () => void }) {
  const user = useCurrentUser();
  const userId = user?.id ?? user?._id ?? '';
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(false);
    try {
      const data = await getInvoicesByClientId(userId);
      setInvoices(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Filtros: texto (cochera o número de factura), estado de pago y período de la reserva.
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [period, setPeriod] = useState<Period>('all');
  const hasFilters = !!q.trim() || status !== 'all' || period !== 'all';
  const clearFilters = () => { setQ(''); setStatus('all'); setPeriod('all'); };
  const isPaid = (inv: any) => inv.status === 'PAGADA';
  const shown = invoices.filter((inv) => {
    return matchesQuery(q, inv.reservation?.parkingSpace?.parking?.name, inv.id)
      && (status === 'all' || (status === 'paid') === isPaid(inv))
      && inPeriod(inv.reservation?.startTime ?? inv.paymentDate, period);
  });
  const paidCount = invoices.filter(isPaid).length;

  return (
    <Drawer title="Facturación y pagos" sub="Tus facturas y su estado de pago" onClose={onClose}>
      <div className="dbody stack" aria-busy={loading}>
        {!loading && !error && invoices.length > 0 && (
          <FilterBar
            search={{ value: q, onChange: setQ, label: 'Buscar en mis facturas', placeholder: 'Cochera o número de factura' }}
            active={hasFilters && shown.length > 0}
            onClear={clearFilters}
          >
            <div className="seg" role="group" aria-label="Filtrar por estado de pago">
              <button type="button" aria-pressed={status === 'all'} onClick={() => setStatus('all')}>Todas<b>{invoices.length}</b></button>
              <button type="button" aria-pressed={status === 'paid'} onClick={() => setStatus('paid')}>Pagadas<b>{paidCount}</b></button>
              <button type="button" aria-pressed={status === 'pending'} onClick={() => setStatus('pending')}>Pendientes<b>{invoices.length - paidCount}</b></button>
            </div>
            <select className="sel" aria-label="Período" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              {PERIODS.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}
            </select>
          </FilterBar>
        )}
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} aria-hidden="true" className="rcard">
              <span className="sk" style={{ height: 14, width: '45%' }} />
              <span className="sk" style={{ height: 12, width: '70%' }} />
            </div>
          ))
        ) : error ? (
          <ErrorBox what="tus facturas" onRetry={load} />
        ) : invoices.length === 0 ? (
          <Empty icon={<FileText className="i" />} title="No tenés facturas todavía">
            Cuando completes una reserva, la factura aparece acá.
          </Empty>
        ) : shown.length === 0 ? (
          <Empty
            icon={<SearchX className="i" />}
            title="Ninguna factura coincide con los filtros"
            action={<button type="button" className="btn" onClick={clearFilters}>Limpiar filtros</button>}
          >
            Probá con otra búsqueda, otro estado u otro período.
          </Empty>
        ) : (
          shown.map((inv) => {
            const paid = inv.status === 'PAGADA';
            const where = inv.reservation?.parkingSpace?.parking?.name || 'Estacionamiento';
            return (
              <article key={inv.id} className="invrow">
                <div>
                  <div className="inm">
                    <span>Factura #{inv.id?.slice(0, 8)}</span>
                    <span className={`st ${paid ? 'ok' : 'warn'}`}>
                      {paid ? <CheckCircle2 className="i sm" aria-hidden="true" /> : <Clock className="i sm" aria-hidden="true" />}
                      {cap(String(inv.status || 'Pendiente').toLowerCase())}
                    </span>
                  </div>
                  <div className="isub">
                    Reserva {inv.reservation?.startTime ? fmtDate(inv.reservation.startTime) : 's/d'} · {where}
                  </div>
                  <div className="isub">
                    {inv.paymentDate ? `Pagada el ${fmtDateTime(inv.paymentDate)}` : 'Pendiente de pago'}
                  </div>
                </div>
                <div className="iamt">
                  <b>{money(inv.totalAmount || 0)}</b>
                  <span>{inv.paymentMethod ? cap(String(inv.paymentMethod).toLowerCase().replace(/_/g, ' ')) : 'Sin método'}</span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </Drawer>
  );
}
