import type { Parking } from '../types/parking.types';
import type { VehicleFilterType } from '../types/mapFilters.types';

export const matchesVehicleCategory = (
  typeStr?: string,
  category?: VehicleFilterType | null
): boolean => {
  if (!category || !typeStr) return false;
  const t = typeStr.trim().toUpperCase();
  if (category === 'MOTO') {
    return t.includes('MOTO');
  }
  if (category === 'CAMIONETA') {
    return (
      t.includes('CAMION') ||
      t.includes('UTIL') ||
      t.includes('VAN') ||
      t.includes('PICK')
    );
  }
  if (category === 'AUTO') {
    return t.includes('AUTO') || t.includes('CAR');
  }
  return false;
};

export const getParkingPriceForCategory = (
  parking: Parking,
  category: VehicleFilterType
): number | null => {
  if (!parking?.prices || parking.prices.length === 0) return null;

  const match = parking.prices.find((p) =>
    matchesVehicleCategory(p.vehicleType, category)
  );

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
  category: VehicleFilterType | null
): SpotPriceResult => {
  // Caso 1: Sin filtro de vehículo -> Menor precio ("Desde $X/h")
  if (!category) {
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

  // Caso 2: Categoría seleccionada (AUTO, MOTO o CAMIONETA)
  const catPrice = getParkingPriceForCategory(parking, category);
  if (catPrice === null) {
    return {
      text: 'No disponible',
      isAvailable: false,
      price: null,
    };
  }

  return {
    text: `$${catPrice.toLocaleString('es-AR')}/h`,
    isAvailable: true,
    price: catPrice,
  };
};

