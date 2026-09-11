import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal, Check, X, Car, Bike, Truck, Tag } from 'lucide-react';
import type { VehicleFilterType } from '../../types/MapFilters';

interface VehicleOption {
  type: VehicleFilterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  { type: 'MOTO', label: 'Moto', icon: Bike, description: 'Tarifa para motos' },
  { type: 'AUTO', label: 'Auto', icon: Car, description: 'Tarifa para autos' },
  { type: 'CAMIONETA', label: 'Camioneta', icon: Truck, description: 'Tarifa utilitarios y pickups' },
];

interface VehicleMapFilterProps {
  selectedVehicleType: VehicleFilterType | null;
  onSelectVehicleType: (type: VehicleFilterType | null) => void;
  className?: string;
}

export const VehicleMapFilter: React.FC<VehicleMapFilterProps> = ({
  selectedVehicleType,
  onSelectVehicleType,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeOption = VEHICLE_OPTIONS.find((opt) => opt.type === selectedVehicleType);

  const handleSelect = (type: VehicleFilterType | null) => {
    onSelectVehicleType(type);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative shrink-0 ${className}`}>
      {/* Botón Trigger del desplegable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border shadow-xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
          selectedVehicleType
            ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/20'
            : 'bg-white/95 dark:bg-zinc-900/95 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white border-zinc-200 dark:border-zinc-800'
        }`}
        title="Filtrar precio por tipo de vehículo"
      >
        {activeOption ? (
          <>
            <activeOption.icon className="h-4 w-4 shrink-0" />
            <span className="font-bold">{activeOption.label}</span>
          </>
        ) : (
          <>
            <SlidersHorizontal className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Filtrar precio</span>
          </>
        )}

        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${selectedVehicleType ? 'text-white/80' : 'text-zinc-400'}`}
        />
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Filtrar precio en el mapa
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Seleccioná un vehículo para ver su tarifa
            </span>
          </div>

          <div className="space-y-1">
            {/* Opción: Sin filtro / Todos (Precio más bajo) */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left cursor-pointer ${
                selectedVehicleType === null
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="h-4 w-4 text-zinc-500 shrink-0" />
                <div>
                  <span className="block font-semibold">Todos los vehículos</span>
                  <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                    Muestra el precio mínimo (Desde $X/h)
                  </span>
                </div>
              </div>
              {selectedVehicleType === null && (
                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </button>

            {/* Opciones por tipo de vehículo */}
            {VEHICLE_OPTIONS.map((opt) => {
              const isSelected = selectedVehicleType === opt.type;
              const IconComp = opt.icon;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSelect(opt.type)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500'}`} />
                    <div>
                      <span className="block font-semibold">{opt.label}</span>
                      <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                        {opt.description}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedVehicleType && (
            <div className="mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="w-full py-1.5 px-3 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Restablecer filtro</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
