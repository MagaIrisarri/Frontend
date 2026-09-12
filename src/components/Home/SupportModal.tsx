import React, { useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface SupportModalProps {
  isSupportOpen: boolean;
  setIsSupportOpen: (v: boolean) => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isSupportOpen, setIsSupportOpen }) => {
  useEffect(() => {
    if (!isSupportOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSupportOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSupportOpen, setIsSupportOpen]);

  if (!isSupportOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
      onClick={() => setIsSupportOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="support-modal-title" className="text-base font-bold text-zinc-900 dark:text-white">
                Centro de Ayuda & Soporte
              </h3>
              <p className="text-xs text-zinc-500">¿Tenés dudas o necesitás asistencia?</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSupportOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <span>🚗</span> ¿Cómo reservo un lugar?
            </h4>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Seleccioná cualquier cochera en el mapa o listado, hacé click en "Reservar en esta Cochera", elegí tu vehículo y confirmá la fecha y hora de tu estadía.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <span>🅿️</span> ¿Cómo puedo ofrecer mi estacionamiento?
            </h4>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Hacé click en "Ofrecé tu estacionamiento" en la barra superior. Podrás dar de alta tu espacio, definir tus tarifas por hora y comenzar a recibir clientes de inmediato.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1.5 text-zinc-700 dark:text-zinc-300">
            <h4 className="font-bold text-blue-600 dark:text-blue-400">Canales de Contacto Directo</h4>
            <p>Email: <span className="font-semibold text-zinc-900 dark:text-white">soporte@cocheras.com</span></p>
            <p>WhatsApp: <span className="font-semibold text-zinc-900 dark:text-white">+54 9 555 555-0000</span></p>
            <p>Atención: Lunes a Sábados de 8:00 a 13:00 hs</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setIsSupportOpen(false)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
