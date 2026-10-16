import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function PageHead({ eyebrow, title, sub, actions }: { eyebrow?: string; title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="pagehead">
      <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>
      <div>{actions}</div>
    </div>
  );
}

export function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="panel empty"><div className="ico">{icon}</div><h3>{title}</h3>{children && <p>{children}</p>}{action}</div>;
}

export function ErrorBox({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="panel empty errbox" role="alert">
      <div className="ico"><AlertCircle className="i" /></div>
      <h3>No pudimos cargar {what}</h3>
      <p>Revisá tu conexión e intentá de nuevo. Si el problema sigue, el servicio puede estar momentáneamente fuera de línea.</p>
      <button type="button" className="btn" onClick={onRetry}><RefreshCw className="i sm" />Reintentar</button>
    </div>
  );
}

export function SkeletonRows({ n, cols = 5 }: { n: number; cols?: number }) {
  return (
    <div className="panel tw"><table className="tbl"><tbody>
      {Array.from({ length: n }, (_, i) => (
        <tr key={i}>{Array.from({ length: cols }, (_, j) => <td key={j}><span className="sk" style={{ height: 14, width: j ? '50%' : '70%' }} /></td>)}</tr>
      ))}
    </tbody></table></div>
  );
}
