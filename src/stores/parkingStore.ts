import { create } from 'zustand';
import type { Parking } from '../types/Parking';
import type { MapFilters, VehicleFilterType } from '../types/MapFilters';
import { DEFAULT_MAP_FILTERS } from '../types/MapFilters';
import { getParking } from '../services/Parking';

interface ParkingState {
  parkings: Parking[];
  selectedParkingId: string | null;
  loading: boolean;
  filters: MapFilters;
  searchQuery: string;

  setParkings: (parkings: Parking[]) => void;
  setSelectedParkingId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setVehicleFilter: (type: VehicleFilterType | null) => void;
  setFilters: (filters: Partial<MapFilters>) => void;
  resetFilters: () => void;
  fetchParkings: () => Promise<void>;
}

export const useParkingStore = create<ParkingState>((set, get) => ({
  parkings: [],
  selectedParkingId: null,
  loading: false,
  filters: DEFAULT_MAP_FILTERS,
  searchQuery: '',

  setParkings: (parkings) => set({ parkings }),
  setSelectedParkingId: (id) => set({ selectedParkingId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setVehicleFilter: (type) =>
    set((state) => ({
      filters: { ...state.filters, vehicleType: type },
    })),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () =>
    set({
      filters: DEFAULT_MAP_FILTERS,
      searchQuery: '',
    }),

  fetchParkings: async () => {
    set({ loading: true });
    try {
      const data = await getParking();
      const list = Array.isArray(data) ? data : (data as any)?.data || [];
      set({ parkings: list, loading: false });
    } catch (err) {
      console.error('Error al cargar estacionamientos en parkingStore:', err);
      set({ loading: false });
    }
  },
}));

