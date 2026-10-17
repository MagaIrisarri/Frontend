import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

// Campo de formulario del prototipo (.field): etiqueta, ayuda y error accesible.
export function Field({ label, error, hint, fixed, children }: { label: string; error?: string; hint?: ReactNode; fixed?: boolean; children: (id: string, aria: Record<string, string | boolean | undefined>) => ReactNode }) {
  const id = useId();
  const aria = { 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-e` : undefined };
  return (
    <div className={fixed ? 'field fx' : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children(id, aria)}
      {/* fixed: el mensaje (ayuda o error) ocupa siempre su línea de 18 px, así que aparecer o cambiar no mueve el resto del formulario */}
      {error ? <div className="ferr" role="alert" id={`${id}-e`} title={error}><AlertCircle className="i sm" />{error}</div> : hint ? <div className="hint">{hint}</div> : fixed && <div className="hint" aria-hidden="true" />}
    </div>
  );
}

export function Input({ label, error, hint, fixed, ...rest }: { label: string; error?: string; hint?: string; fixed?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return <Field label={label} error={error} hint={hint} fixed={fixed}>{(id, aria) => <input className="inp" id={id} {...aria} {...rest} />}</Field>;
}

export function Password({ label, error, hint, fixed, ...rest }: { label: string; error?: string; hint?: string; fixed?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error} hint={hint} fixed={fixed}>
      {(id, aria) => (
        <div className="pw">
          <input className="inp" id={id} type={show ? 'text' : 'password'} {...aria} {...rest} />
          <button type="button" className="icon-btn sm" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow(s => !s)}>
            {show ? <EyeOff className="i sm" /> : <Eye className="i sm" />}
          </button>
        </div>
      )}
    </Field>
  );
}

// Mensaje de error de axios o genérico.
export const apiError = (err: any, fallback = 'No se pudo guardar. Intentá de nuevo.') =>
  err?.response?.data?.message || err?.response?.data?.errors?.[0]?.mensaje || fallback;
