import React, { useState } from 'react';
import { CreditCard, Banknote, Smartphone, CheckCircle2, X } from 'lucide-react';
import { payInvoice } from '../../services/invoice.service';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  invoiceId: string;
  totalAmount: number;
  onSuccess: () => void;
}

export default function CheckoutModal({ isOpen, onClose, invoiceId, totalAmount, onSuccess }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePay = async (method: string) => {
    setLoading(true);
    setError('');
    try {
      await payInvoice(invoiceId, method);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-all">
        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4 animate-in zoom-in">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">¡Pago Exitoso!</h2>
            <p className="text-slate-500 dark:text-zinc-400">La factura ha sido pagada y la reserva finalizada.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cobro de Estadía</h2>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 text-center border-b border-slate-100 dark:border-zinc-800">
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-2 uppercase tracking-widest">Total a Pagar</p>
              <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                ${Number(totalAmount).toLocaleString('es-AR')}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Seleccionar Método de Pago</p>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <button
                  disabled={loading}
                  onClick={() => handlePay('EFECTIVO')}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left group disabled:opacity-50"
                >
                  <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 text-slate-600 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Efectivo</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">Cobro presencial en caja</div>
                  </div>
                </button>

                <button
                  disabled={loading}
                  onClick={() => handlePay('TARJETA')}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group disabled:opacity-50"
                >
                  <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 text-slate-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Tarjeta (POS)</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">Débito o Crédito</div>
                  </div>
                </button>

                <button
                  disabled={loading}
                  onClick={() => handlePay('TRANSFERENCIA')}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group disabled:opacity-50"
                >
                  <div className="bg-slate-100 dark:bg-zinc-800 p-3 rounded-xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 text-slate-600 dark:text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">MercadoPago / Transferencia</div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">Escaneo de QR o alias</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

