import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <section className="relative min-h-[calc(100vh-57px)] w-full flex items-center justify-center overflow-hidden bg-zinc-950 px-6 py-24">
      {/* Contenido principal sobre fondo estático */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Gestión y Reservas</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          Elegí tu sucursal, reservá por horas completas con margen garantizado y sumá servicios de lavado y mantenimiento desde una sola plataforma.
        </h2>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <span>Reservar Cochera</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-medium text-sm transition-colors"
          >
            Ingreso al Sistema
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Home;