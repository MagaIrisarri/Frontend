import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, SlidersHorizontal, Check, X, Tag } from 'lucide-react';
import { iconOf } from '../Owner/ui/vehicles';
import { useVehicleTypes } from '../../hooks/useVehicleTypes';
import { typeLabel, typePlural } from '../../pages/Owner/owner.lib';
import type { VehicleFilterType } from '../../types/mapFilters.types';

interface VehicleOption {
  type: VehicleFilterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface VehicleMapFilterProps {
  selectedVehicleType: VehicleFilterType | null;
  onSelectVehicleType: (type: VehicleFilterType | null) => void;
  className?: string;
}

// Se monta dentro de .owner (barra superior de Home): usa .btn / .menu del formato del rol dueño.
export const VehicleMapFilter: React.FC<VehicleMapFilterProps> = ({
  selectedVehicleType,
  onSelectVehicleType,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // R-30: un ítem por tipo del catálogo del administrador (AUTO, MOTO, CAMIONETA y los que agregue).
  const { types } = useVehicleTypes();
  const VEHICLE_OPTIONS: VehicleOption[] = types.map((t) => ({
    type: { id: t.id, name: t.name }, label: typeLabel(t.name), icon: iconOf(t.name), description: `Tarifa para ${typePlural(t.name).toLowerCase()}`,
  }));
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera o con Escape
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const activeOption = selectedVehicleType
    ? VEHICLE_OPTIONS.find((opt) => opt.type.id === selectedVehicleType.id)
      ?? { type: selectedVehicleType, label: typeLabel(selectedVehicleType.name), icon: iconOf(selectedVehicleType.name), description: '' }
    : undefined;

  const handleSelect = (type: VehicleFilterType | null) => {
    onSelectVehicleType(type);
    setIsOpen(false);
  };

  const item = (
    key: string,
    checked: boolean,
    Icon: React.ComponentType<{ className?: string }>,
    label: string,
    description: string,
    type: VehicleFilterType | null
  ) => (
    <button key={key} type="button" role="menuitemradio" aria-checked={checked} onClick={() => handleSelect(type)}>
      <span>
        <Icon className="i" />
        <span>
          {label}
          <small>{description}</small>
        </span>
      </span>
      {checked && <Check className="i" />}
    </button>
  );

  return (
    <div ref={dropdownRef} className={`vwrap ${className}`}>
      <button
        type="button"
        className={`btn hfloat${selectedVehicleType ? ' on' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {activeOption ? <activeOption.icon className="i" /> : <SlidersHorizontal className="i" />}
        <span className="lbl-d">Vehículo: {activeOption ? activeOption.label : 'Todos'}</span>
        <ChevronDown className="i sm" />
      </button>

      {isOpen && (
        <div role="menu" aria-label="Tipo de vehículo" className="menu on vmenu">
          <div className="mh">Mostrá solo las cocheras con lugar y tarifa para tu vehículo.</div>
          {item('all', selectedVehicleType === null, Tag, 'Todos los vehículos', 'Sin filtrar: precio mínimo (Desde $X/h)', null)}
          {VEHICLE_OPTIONS.map((opt) =>
            item(opt.type.id, selectedVehicleType?.id === opt.type.id, opt.icon, opt.label, opt.description, opt.type)
          )}
          {selectedVehicleType && (
            <>
              <hr />
              <button type="button" role="menuitem" onClick={() => handleSelect(null)}>
                <span>
                  <X className="i" />
                  Restablecer filtro
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
