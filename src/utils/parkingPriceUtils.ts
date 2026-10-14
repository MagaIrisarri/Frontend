import type { Parking } from '../types/parking.types';
import type { VehicleFilterType } from '../types/mapFilters.types';

// R-30: tarifas y plazas van por el id del tipo de vehículo (cualquiera del catálogo del administrador).

export const getParkingPriceForType = (parking: Parking, typeId: string): number | null => {
  const match = parking?.prices?.find((p) => p.vehicleTypeId === typeId);
  if (!match) return null;
  const num = Number(match.price);
  return isNaN(num) || num <= 0 ? null : num;
};

export const getParkingMinPrice = (parking: Parking): number | null => {
  if (!parking?.prices || parking.prices.length === 0) return null;

  const validPrices = parking.prices
    .map((p) => Number(p.price))
    .filter((pr) => !isNaN(pr) && pr > 0);

  if (validPrices.length === 0) return null;
  return Math.min(...validPrices);
};

export interface SpotPriceResult {
  text: string;
  isAvailable: boolean;
  price: number | null;
}

export const formatSpotPrice = (
  parking: Parking,
  type: VehicleFilterType | null
): SpotPriceResult => {
  // Caso 1: Sin filtro de vehículo -> Menor precio ("Desde $X/h")
  if (!type) {
    const min = getParkingMinPrice(parking);
    if (min === null) {
      return {
        text: 'Consultar precio',
        isAvailable: false,
        price: null,
      };
    }
    return {
      text: `Desde $${min.toLocaleString('es-AR')}/h`,
      isAvailable: true,
      price: min,
    };
  }

  // Caso 2: Tipo seleccionado
  const typePrice = getParkingPriceForType(parking, type.id);
  if (typePrice === null) {
    return {
      text: 'No disponible',
      isAvailable: false,
      price: null,
    };
  }

  return {
    text: `$${typePrice.toLocaleString('es-AR')}/h`,
    isAvailable: true,
    price: typePrice,
  };
};

// Plazas libres del tipo; si el backend no manda el dato, cae a la capacidad. Sin plazas de ese tipo, 0.
export const getTypeSpaces = (parking: Parking, typeId: string): number => {
  const t = parking.spaceTypes?.find((s) => s.vehicleTypeId === typeId);
  return t ? t.available ?? t.capacity : 0;
};

/** Por qué una cochera no sirve para el tipo; null si sirve. */
export const getUnavailableReason = (
  parking: Parking,
  typeId: string
): 'NO_PRICE' | 'NO_SPACE' | null => {
  if (getParkingPriceForType(parking, typeId) === null) return 'NO_PRICE';
  if (getTypeSpaces(parking, typeId) <= 0) return 'NO_SPACE';
  return null;
};
