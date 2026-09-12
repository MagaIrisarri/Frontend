import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  Calendar,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Car,
} from 'lucide-react';
import { loginUser } from '@/services/user.service';
import { useAuthStore } from '@/stores/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onSuccess?: (user: any) => void;
}

interface FormErrors {
  name?: string;
  last_name?: string;
  dni?: string;
  phone?: string;
  date_of_birth?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const REGISTER_FIELD_ORDER = [
  'name',
  'last_name',
  'dni',
  'phone',
  'date_of_birth',
  'email',
  'password',
  'confirmPassword',
] as const;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Estados de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Estados de Registro
  const [registerForm, setRegisterForm] = useState({
    name: '',
    last_name: '',
    dni: '',
    phone: '',
    date_of_birth: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [registerTouched, setRegisterTouched] = useState<Record<string, boolean>>({});
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({});
  const [registerSubmitted, setRegisterSubmitted] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setLoginError(null);
      setRegisterErrors({});
      setRegisterSubmitted(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Validación de campo individual de registro
  const validateRegisterField = (name: string, value: string, currentForm = registerForm): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim() || value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        break;
      case 'last_name':
        if (!value.trim() || value.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres';
        break;
      case 'dni':
        if (!value.trim() || !/^\d{7,8}$/.test(value.trim())) return 'El DNI debe tener 7 u 8 dígitos';
        break;
      case 'phone':
        if (!value.trim() || value.trim().length < 6) return 'Ingresá un número de teléfono válido';
        break;
      case 'date_of_birth':
        if (!value) return 'Seleccioná tu fecha de nacimiento';
        const birthDate = new Date(value);
        if (isNaN(birthDate.getTime()) || birthDate >= new Date()) return 'La fecha de nacimiento no puede ser futura';
        break;
      case 'email':
        if (!value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Ingresá un correo electrónico válido';
        break;
      case 'password':
        if (!value || value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'confirmPassword':
        if (!value) return 'Repetí tu contraseña';
        if (value !== currentForm.password) return 'Las contraseñas no coinciden';
        break;
    }
    return undefined;
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === 'dni') sanitizedValue = value.replace(/\D/g, '').slice(0, 8);
    else if (name === 'phone') sanitizedValue = value.replace(/\D/g, '').slice(0, 15);

    const newForm = { ...registerForm, [name]: sanitizedValue };
    setRegisterForm(newForm);

    if (registerTouched[name] || registerSubmitted) {
      const err = validateRegisterField(name, sanitizedValue, newForm);
      setRegisterErrors((prev) => ({ ...prev, [name]: err, general: undefined }));
    }

    if (name === 'password' && (registerTouched.confirmPassword || registerSubmitted) && newForm.confirmPassword) {
      const confirmErr = validateRegisterField('confirmPassword', newForm.confirmPassword, newForm);
      setRegisterErrors((prev) => ({ ...prev, confirmPassword: confirmErr }));
    }
  };

  const handleRegisterBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateRegisterField(name, value, registerForm);
    setRegisterErrors((prev) => ({ ...prev, [name]: err }));
  };

  const isRegisterFieldInvalid = (fieldName: string): boolean => {
    return Boolean((registerTouched[fieldName] || registerSubmitted) && registerErrors[fieldName as keyof FormErrors]);
  };

  const totalRegisterFieldErrors = Object.keys(registerErrors).filter(
    (k) => k !== 'general' && registerErrors[k as keyof FormErrors] && (registerTouched[k] || registerSubmitted)
  ).length;

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const data = await loginUser(loginEmail.trim(), loginPassword);
      const userData = data.user || data.data;

      useAuthStore.getState().setUser(userData);
      if (onSuccess) onSuccess(userData);
      onClose();
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoginLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSubmitted(true);

    const allTouched: Record<string, boolean> = {};
    REGISTER_FIELD_ORDER.forEach((key) => {
      allTouched[key] = true;
    });
    setRegisterTouched(allTouched);

    const newErrors: FormErrors = {};
    let firstInvalid: string | null = null;

    REGISTER_FIELD_ORDER.forEach((key) => {
      const err = validateRegisterField(key, registerForm[key], registerForm);
      if (err) {
        newErrors[key] = err;
        if (!firstInvalid) firstInvalid = key;
      }
    });

    setRegisterErrors(newErrors);

    if (firstInvalid) {
      const el = document.getElementById(`modal-reg-${firstInvalid}`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setRegisterLoading(true);

    try {
      const payload = {
        name: registerForm.name.trim(),
        last_name: registerForm.last_name.trim(),
        dni: registerForm.dni.trim(),
        phone: registerForm.phone.trim(),
        date_of_birth: registerForm.date_of_birth,
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
        type: 'CLIENTE',
      };

      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors: FormErrors = {};
          data.errors.forEach((err: any) => {
            const field = err.path?.[err.path.length - 1];
            if (field && field in registerForm) {
              fieldErrors[field as keyof FormErrors] = err.message;
              setRegisterTouched((prev) => ({ ...prev, [field]: true }));
            }
          });
          setRegisterErrors({ ...fieldErrors, general: undefined });
          return;
        }
        setRegisterErrors({ general: data.error || data.message || 'No se pudo completar el registro' });
        return;
      }

      // Auto-login tras registro exitoso
      const loginData = await loginUser(payload.email, payload.password);
      const userData = loginData.user || loginData.data;

      useAuthStore.getState().setUser(userData);
      if (onSuccess) onSuccess(userData);
      onClose();
    } catch (err: any) {
      setRegisterErrors({ general: err.message || 'Error de conexión con el servidor.' });
    } finally {
      setRegisterLoading(false);
    }
  };

  const inputClass = (isInvalid: boolean) => `
    w-full rounded-xl border ${
      isInvalid
        ? 'border-red-500/80 bg-red-500/5 text-red-900 dark:text-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-blue-500'
    } py-2.5 text-sm placeholder-zinc-400 focus:outline-none transition-colors
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60  animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 my-8">
        
        {/* Cabecera y Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white block">
                Servicio<span className="text-blue-500">Cocheras</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selector de Pestaña: Iniciar Sesión / Crear Cuenta */}
        <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-950 p-1.5 border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* TAB 1: INICIAR SESIÃ“N */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-150">
            {loginError && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className={`${inputClass(false)} pl-10 pr-4`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass(false)} pl-10 pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-zinc-500 pt-2">
              ¿No tenés una cuenta?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Registrate acá
              </button>
            </p>
          </form>
        )}

        {/* TAB 2: CREAR CUENTA */}
        {activeTab === 'register' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {registerSubmitted && totalRegisterFieldErrors > 0 && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-medium leading-relaxed"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-bold block">Revisá los datos ingresados</span>
                  <span>
                    {totalRegisterFieldErrors === 1
                      ? 'Hay 1 campo que necesita corrección.'
                      : `Hay ${totalRegisterFieldErrors} campos que necesitan corrección.`}
                  </span>
                </div>
              </div>
            )}

            {registerErrors.general && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs font-medium leading-relaxed"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{registerErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col justify-start">
                  <label htmlFor="modal-reg-name" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      id="modal-reg-name"
                      type="text"
                      name="name"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      onBlur={handleRegisterBlur}
                      placeholder="Juan"
                      className={`${inputClass(isRegisterFieldInvalid('name'))} pl-9 pr-3 py-2`}
                    />
                  </div>
                  {isRegisterFieldInvalid('name') && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {registerErrors.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col justify-start">
                  <label htmlFor="modal-reg-last_name" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Apellido
                  </label>
                  <input
                    id="modal-reg-last_name"
                    type="text"
                    name="last_name"
                    value={registerForm.last_name}
                    onChange={handleRegisterChange}
                    onBlur={handleRegisterBlur}
                    placeholder="Pérez"
                    className={`${inputClass(isRegisterFieldInvalid('last_name'))} px-3 py-2`}
                  />
                  {isRegisterFieldInvalid('last_name') && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {registerErrors.last_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col justify-start">
                  <label htmlFor="modal-reg-dni" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    DNI
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      id="modal-reg-dni"
                      type="text"
                      name="dni"
                      maxLength={8}
                      value={registerForm.dni}
                      onChange={handleRegisterChange}
                      onBlur={handleRegisterBlur}
                      placeholder="40123456"
                      className={`${inputClass(isRegisterFieldInvalid('dni'))} pl-9 pr-3 py-2`}
                    />
                  </div>
                  {isRegisterFieldInvalid('dni') && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {registerErrors.dni}
                    </p>
                  )}
                </div>

                <div className="flex flex-col justify-start">
                  <label htmlFor="modal-reg-phone" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      id="modal-reg-phone"
                      type="tel"
                      name="phone"
                      maxLength={15}
                      value={registerForm.phone}
                      onChange={handleRegisterChange}
                      onBlur={handleRegisterBlur}
                      placeholder="3364001086"
                      className={`${inputClass(isRegisterFieldInvalid('phone'))} pl-9 pr-3 py-2`}
                    />
                  </div>
                  {isRegisterFieldInvalid('phone') && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {registerErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col justify-start">
                  <label htmlFor="modal-reg-date_of_birth" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      id="modal-reg-date_of_birth"
                      type="date"
                      name="date_of_birth"
                      value={registerForm.date_of_birth}
                      onChange={handleRegisterChange}
                      onBlur={handleRegisterBlur}
                      className={`${inputClass(isRegisterFieldInvalid('date_of_birth'))} pl-9 pr-3 py-2 [color-scheme:light] dark:[color-scheme:dark]`}
                    />
                  </div>
                  {isRegisterFieldInvalid('date_of_birth') && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {registerErrors.date_of_birth}
                    </p>
                  )}
                </div>

                <div className="flex flex-col justify-start">
                  <label htmlFor="modal-reg-email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      id="modal-reg-email"
                      type="email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      onBlur={handleRegisterBlur}
                      placeholder="juan@correo.com"
                      className={`${inputClass(isRegisterFieldInvalid('email'))} pl-9 pr-3 py-2`}
                    />
                  </div>
                  {isRegisterFieldInvalid('email') && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {registerErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col justify-start">
                  <label htmlFor="modal-reg-password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      id="modal-reg-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      onBlur={handleRegisterBlur}
                      placeholder="Mínimo 6 caracteres"
                      className={`${inputClass(isRegisterFieldInvalid('password'))} pl-9 pr-8 py-2`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isRegisterFieldInvalid('password') && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {registerErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex flex-col justify-start">
                  <label htmlFor="modal-reg-confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                    Confirmar Clave
                  </label>
                  <div className="relative">
                    <input
                      id="modal-reg-confirmPassword"
                      type={showRegisterConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      onBlur={handleRegisterBlur}
                      placeholder="Repetir contraseña"
                      className={`${inputClass(isRegisterFieldInvalid('confirmPassword'))} px-3 pr-8 py-2`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirm(!showRegisterConfirm)}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showRegisterConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isRegisterFieldInvalid('confirmPassword') && (
                    <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
                      {registerErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {registerLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Completar Registro</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-zinc-500 pt-1">
              ¿Ya tenés una cuenta?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Iniciá sesión acá
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;

