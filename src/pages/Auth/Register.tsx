import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  Calendar,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ShineBorder } from '../../components/ui/shine-border';

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
  type?: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();



  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    dni: '',
    phone: '',
    date_of_birth: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Manejo de cambios con sanitización en tiempo real
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let sanitizedValue = value;

    // Restricciones de solo números para DNI y Teléfono[cite: 3, 8]
    if (name === 'dni') {
      sanitizedValue = value.replace(/\D/g, '').slice(0, 8);
    } else if (name === 'phone') {
      sanitizedValue = value.replace(/\D/g, '').slice(0, 15);
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));

    // Limpiar error del campo que se está editando
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  // Validaciones del Frontend previas al envío
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'; //[cite: 8]
    }

    if (!formData.last_name.trim() || formData.last_name.trim().length < 2) {
      newErrors.last_name = 'El apellido debe tener al menos 2 caracteres'; //[cite: 8]
    }

    if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe tener 7 u 8 dígitos numéricos'; //[cite: 3]
    }

    if (!formData.phone || formData.phone.length < 6) {
      newErrors.phone = 'Ingresá un número de teléfono válido (solo números)'; //[cite: 3]
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Seleccioná tu fecha de nacimiento'; //[cite: 3, 8]
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.date_of_birth = 'La fecha de nacimiento no puede ser futura';
      }
    }

    if(!formData.type){
      newErrors.type = 'Seleccioná un tipo de usuario';
    }
    else{
      const type = String(formData.type);
      if (type != 'DUEÑO' && type != 'CLIENTE'){
        newErrors.type = 'Seleccioná un tipo de usuario valido';
      }
    }
    

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Ingresá un correo electrónico válido'; //[cite: 3, 8]
    }

    if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'; //[cite: 8]
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        last_name: formData.last_name.trim(),
        dni: formData.dni.trim(),
        phone: formData.phone.trim(),
        date_of_birth: formData.date_of_birth,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        type: formData.type
      };

      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // 1. Captura de errores de validación de Zod[cite: 8]
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors: FormErrors = {};
          data.errors.forEach((err: any) => {
            const field = err.path?.[err.path.length - 1];
            if (field && field in formData) {
              fieldErrors[field as keyof FormErrors] = err.message;
            }
          });
          const generalMessage = data.errors.map((err: any) => err.message).join(' • ');
          setErrors({ ...fieldErrors, general: generalMessage });
          return;
        }

        // 2. Captura de errores de lógica de negocio o base de datos[cite: 4, 9]
        const backendError = data.error || data.message || 'No se pudo completar el registro'; //[cite: 4]
        setErrors({ general: backendError });
        return;
      }

      alert('¡Cuenta creada exitosamente! Iniciá sesión para continuar.');
      navigate('/login');
    } catch (err: any) {
      setErrors({
        general: err.message || 'Error de conexión con el servidor. Verificá que el backend esté activo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-6 py-12 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <Car className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Servicio<span className="text-blue-500">Cocheras</span>
          </span>
        </div>

        {/* Formulario con ShineBorder */}
        <ShineBorder
          className="w-full bg-zinc-900/90 border border-zinc-800 p-8 shadow-2xl backdrop-blur-md"
          color={['#2563EB', '#38BDF8', '#818CF8']}
          borderRadius={16}
          borderWidth={1.5}
          duration={10}
        >
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Crear una cuenta</h2>
            <p className="text-sm text-zinc-400 mt-1">Ingresá tus datos personales para comenzar a operar</p>
          </div>

          {/* Banner de Error General */}
          {errors.general && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-medium leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Juan"
                    className={`w-full rounded-xl border ${
                      errors.name ? 'border-red-500/80 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70'
                    } pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Apellido
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Pérez"
                  className={`w-full rounded-xl border ${
                    errors.last_name ? 'border-red-500/80 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70'
                  } px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors`}
                />
                {errors.last_name && <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.last_name}</p>}
              </div>
            </div>

            {/* DNI y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  DNI
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    name="dni"
                    maxLength={8}
                    value={formData.dni}
                    onChange={handleChange}
                    placeholder="40123456"
                    className={`w-full rounded-xl border ${
                      errors.dni ? 'border-red-500/80 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70'
                    } pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors`}
                  />
                </div>
                {errors.dni && <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.dni}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="tel"
                    name="phone"
                    maxLength={15}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="3364001086"
                    className={`w-full rounded-xl border ${
                      errors.phone ? 'border-red-500/80 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70'
                    } pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors`}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.phone}</p>}
              </div>
            </div>

            {/* Fecha de Nacimiento y Correo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Fecha de Nacimiento
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className={`w-full rounded-xl border ${
                      errors.date_of_birth ? 'border-red-500/80 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70'
                    } pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors [color-scheme:dark]`}
                  />
                </div>
                {errors.date_of_birth && (
                  <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.date_of_birth}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="juan@correo.com"
                    className={`w-full rounded-xl border ${
                      errors.email ? 'border-red-500/80 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70'
                    } pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.email}</p>}
              </div>
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    className={`w-full rounded-xl border ${
                      errors.password ? 'border-red-500/80 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70'
                    } pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors`}
                  />
                </div>
                {errors.password && <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Confirmar Clave
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repetir contraseña"
                  className={`w-full rounded-xl border ${
                    errors.confirmPassword ? 'border-red-500/80 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70'
                  } px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Tipo de usuario
                </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full rounded-xl border ${
                  errors.type ? 'border-red-500/80 bg-red-500/5' : 'border-zinc-800 bg-zinc-950/70'
                } px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors [color-scheme:dark]`}
              >
                <option value="">Seleccione tipo de usuario</option>
                <option value="CLIENTE">Cliente</option>
                <option value="DUEÑO">Dueño</option>
              </select>
            {errors.type && (
                  <p className="mt-1 text-[11px] text-red-400 font-medium">{errors.type}</p>
                )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Completar Registro</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-500">
            ¿Ya tenés una cuenta?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline"
            >
              Iniciá sesión
            </Link>
          </p>
        </ShineBorder>
      </div>
    </div>
  );
};

export default Register;