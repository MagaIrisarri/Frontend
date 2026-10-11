import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { loginUser } from '@/services/user.service';
import { useAuthStore } from '@/stores/authStore';
import { Drawer } from '../Owner/ui/Layer';
import OwnerShell from '../Owner/ui/OwnerShell';
import { Presence } from '../Owner/ui/Presence';
import { Field, Input, Password } from '../Owner/ui/Field';

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onSuccess?: (user: any) => void;
}

type FormErrors = Partial<Record<(typeof FIELDS)[number] | 'general', string>>;

const FIELDS = ['name', 'last_name', 'dni', 'phone', 'date_of_birth', 'email', 'password', 'confirmPassword', 'type'] as const;
type FieldName = (typeof FIELDS)[number];

const EMPTY: Record<FieldName, string> = {
  name: '', last_name: '', dni: '', phone: '', date_of_birth: '', email: '', password: '', confirmPassword: '', type: 'CLIENTE',
};

function validate(name: FieldName, value: string, form: Record<FieldName, string>): string | undefined {
  switch (name) {
    case 'name':
      if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
      break;
    case 'last_name':
      if (value.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres';
      break;
    case 'dni':
      if (!/^\d{7,8}$/.test(value.trim())) return 'El DNI debe tener 7 u 8 dígitos';
      break;
    case 'phone':
      if (value.trim().length < 6) return 'Ingresá un número de teléfono válido';
      break;
    case 'date_of_birth': {
      if (!value) return 'Seleccioná tu fecha de nacimiento';
      const birth = new Date(value);
      if (isNaN(birth.getTime()) || birth >= new Date()) return 'La fecha de nacimiento no puede ser futura';
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 18) return 'Debés ser mayor de 18 años para registrarte';
      break;
    }
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Ingresá un correo electrónico válido';
      break;
    case 'password':
      if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      break;
    case 'confirmPassword':
      if (!value) return 'Repetí tu contraseña';
      if (value !== form.password) return 'Las contraseñas no coinciden';
      break;
    case 'type':
      if (value !== 'CLIENTE' && value !== 'DUEÑO') return 'Elegí un tipo de cuenta válido';
      break;
  }
  return undefined;
}

// Iniciar sesión y crear cuenta en un panel lateral del estándar (reemplaza al modal Tailwind).
export function AuthDrawer(props: AuthDrawerProps) {
  return (
    <Presence open={props.isOpen}>
      <OwnerShell bare>
        <Content {...props} />
      </OwnerShell>
    </Presence>
  );
}

function Content({ onClose, initialTab = 'login', onSuccess }: AuthDrawerProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [errors, setErrors] = useState<FormErrors>({});

  const finish = (data: any) => {
    const user = data.user || data.data;
    useAuthStore.getState().setUser(user);
    onSuccess?.(user);
    onClose();
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      finish(await loginUser(email.trim(), password));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as FieldName;
    let value = e.target.value;
    if (name === 'dni') value = value.replace(/\D/g, '').slice(0, 8);
    if (name === 'phone') value = value.replace(/\D/g, '').slice(0, 15);
    const next = { ...form, [name]: value };
    setForm(next);
    setError(null);
    setErrors((prev) => {
      const out = { ...prev };
      if (touched[name]) out[name] = validate(name, value, next);
      if (name === 'password' && touched.confirmPassword && next.confirmPassword) out.confirmPassword = validate('confirmPassword', next.confirmPassword, next);
      return out;
    });
  };

  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as FieldName;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, e.target.value, form) }));
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched(Object.fromEntries(FIELDS.map((f) => [f, true])));
    const found: FormErrors = {};
    for (const f of FIELDS) {
      const msg = validate(f, form[f], form);
      if (msg) found[f] = msg;
    }
    setErrors(found);
    const first = FIELDS.find((f) => found[f]);
    if (first) {
      document.querySelector<HTMLElement>(`#auth-form [name="${first}"]`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        last_name: form.last_name.trim(),
        dni: form.dni.trim(),
        phone: form.phone.trim(),
        date_of_birth: form.date_of_birth,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        type: form.type,
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data.errors)) {
          const fieldErrors: FormErrors = {};
          data.errors.forEach((er: any) => {
            const f = er.path?.[er.path.length - 1];
            if (f && (FIELDS as readonly string[]).includes(f)) fieldErrors[f as FieldName] = er.message;
          });
          setErrors(fieldErrors);
        } else {
          setError(data.error || data.message || 'No se pudo completar el registro');
        }
        return;
      }
      finish(await loginUser(payload.email, payload.password)); // inicia sesión al terminar el alta
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const f = (name: FieldName) => ({ name, value: form[name], onChange: change, onBlur: blur, error: touched[name] ? errors[name] : undefined });
  const isLogin = tab === 'login';
  const nerrs = FIELDS.filter((x) => touched[x] && errors[x]).length;

  return (
    <Drawer
      title={isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
      sub={isLogin ? 'Ingresá para reservar y guardar tus cocheras.' : 'Completá tus datos para empezar a reservar.'}
      onClose={onClose}
      footer={
        <div className="dfoot">
          <button type="submit" form="auth-form" className="btn pri" disabled={loading} aria-busy={loading || undefined}>
            {loading ? (isLogin ? 'Ingresando…' : 'Creando cuenta…') : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </div>
      }
    >
      <form id="auth-form" className="dbody stack" onSubmit={isLogin ? submitLogin : submitRegister} noValidate>
        <div className="seg" role="group" aria-label="Acceso">
          <button type="button" aria-pressed={isLogin} onClick={() => { setTab('login'); setError(null); }}>Iniciar sesión</button>
          <button type="button" aria-pressed={!isLogin} onClick={() => { setTab('register'); setError(null); }}>Crear cuenta</button>
        </div>

        {error && <div className="ferr" role="alert"><AlertCircle className="i sm" />{error}</div>}
        {!isLogin && nerrs > 0 && !error && <div className="ferr" role="alert"><AlertCircle className="i sm" />Revisá los campos marcados.</div>}

        {isLogin ? (
          <>
            <Input label="Correo electrónico" type="email" autoComplete="email" placeholder="ejemplo@correo.com" value={email} required
              onChange={(e) => setEmail(e.target.value)} />
            <Password label="Contraseña" autoComplete="current-password" placeholder="••••••••" value={password} required
              onChange={(e) => setPassword(e.target.value)} />
          </>
        ) : (
          <>
            <div className="grid2">
              <Input label="Nombre" autoComplete="given-name" placeholder="Juan" {...f('name')} />
              <Input label="Apellido" autoComplete="family-name" placeholder="Pérez" {...f('last_name')} />
            </div>
            <div className="grid2">
              <Input label="DNI" inputMode="numeric" placeholder="40123456" {...f('dni')} />
              <Input label="Teléfono" type="tel" autoComplete="tel" placeholder="3364001086" {...f('phone')} />
            </div>
            <Input label="Fecha de nacimiento" type="date" autoComplete="bday" {...f('date_of_birth')} />
            <Input label="Correo electrónico" type="email" autoComplete="email" placeholder="juan@correo.com" {...f('email')} />
            <div className="grid2">
              <Password label="Contraseña" autoComplete="new-password" placeholder="Mínimo 6 caracteres" {...f('password')} />
              <Password label="Repetir contraseña" autoComplete="new-password" placeholder="Repetí tu contraseña" {...f('confirmPassword')} />
            </div>
            <Field label="Tipo de cuenta" error={touched.type ? errors.type : undefined}>
              {(id, aria) => (
                <select className="sel" id={id} {...aria} name="type" value={form.type} onChange={change} onBlur={blur}>
                  <option value="CLIENTE">Cliente</option>
                  <option value="DUEÑO">Dueño de cochera</option>
                </select>
              )}
            </Field>
          </>
        )}
      </form>
    </Drawer>
  );
}
