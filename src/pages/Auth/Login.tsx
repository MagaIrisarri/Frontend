import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { ShineBorder } from '@/components/ui/shine-border';
import { loginUser } from '@/services/User.js';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginUser(email.trim(), password);
      const userData = data.user || data.data;
      const userId = userData?.id || userData?._id;

      // Guardar sesión unificada en ambas claves para evitar desincronización
      localStorage.setItem('user', JSON.stringify(userData));
      if (userId) {
        localStorage.setItem('parkflow_user_id', userId);
      }

      // Redirigir según el rol
      if (userData?.type === 'DUEÑO') {
        navigate('/owner');
      } else if (userData?.type === 'ADMINISTRADOR') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <Car className="h-6 w-6" />
          </div>
          
          <span className="text-2xl font-black tracking-tight text-white">
            Servicio<span className="text-blue-500">Cocheras</span>
          </span>
        </div>

        {/* Tarjeta con efecto ShineBorder */}
        <ShineBorder
          className="w-full bg-zinc-900/90 border border-zinc-800 p-8 shadow-2xl backdrop-blur-md"
          color={['#e3e0ec', '#8915a0', '#e3e0ec']}
          borderRadius={16}
          borderWidth={1.5}
          duration={35}
        >
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">Bienvenido de nuevo</h2>
            <p className="text-sm text-zinc-400 mt-1">Ingresá tus credenciales para acceder</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Contraseña
                </label>
                <a href="#" className="text-xs text-blue-400 hover:text-blue-300">
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-500">
            ¿No tenés una cuenta?{' '}
            <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline">
              Registrate
            </Link>
          </p>
        </ShineBorder>
      </div>
    </div>
  );
};

export default Login;