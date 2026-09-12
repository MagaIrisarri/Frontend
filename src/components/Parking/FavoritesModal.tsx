import React from 'react';
import { X, Star, MapPin, Clock, Trash2, ChevronRight, Car } from 'lucide-react';
import type { Parking } from '../../types/parking.types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteParkings: Parking[];
  onRemoveFavorite: (id: string) => void;
  onSelectParking: (id: string) => void;
  onOpenReservation: (parking: Parking) => void;
}

const DEFAULT_PARKING_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80';

export function FavoritesModal({
  isOpen,
  onClose,
  favoriteParkings,
  onRemoveFavorite,
  onSelectParking,
  onOpenReservation,
}: FavoritesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60  animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Cocheras Favoritas</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tus estacionamientos guardados</p>
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

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {favoriteParkings.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-3xl bg-zinc-100 dark:bg-zinc-800 text-amber-500">
                <Star className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Aún no tenés favoritos guardados</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                Tocá el ícono de estrella o corazón en cualquier cochera para tenerla a mano cuando necesites estacionar.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/25"
              >
                Explorar Cocheras
              </button>
            </div>
          ) : (
            favoriteParkings.map((p) => {
              const imgUrl = p.imageUrl || p.image || DEFAULT_PARKING_IMAGE;

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <img
                    src={imgUrl}
                    alt={p.name}
                    className="w-full sm:w-24 h-24 rounded-xl object-cover bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
                    }}
                  />

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{p.name}</h4>
                        <button
                          type="button"
                          onClick={() => onRemoveFavorite(p.id)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Quitar de favoritos"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                        {p.address}, {p.locality}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          {p.openingTime} - {p.closingTime} hs
                        </span>
                        {p.carCapacity !== undefined && p.carCapacity > 0 && (
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <Car className="h-3 w-3 text-zinc-400" />
                            {p.carCapacity} plazas
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectParking(p.id);
                          onClose();
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer text-center"
                      >
                        Ver en Mapa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenReservation(p);
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm"
                      >
                        <span>Reservar</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


