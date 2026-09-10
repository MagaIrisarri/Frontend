import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const vehicleService = {
  async getVehicles(userId: string) {
    try {
      const res = await api.get(`/api/vehicles/client/${userId}`);
      return res.data?.data ?? res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al obtener vehículos');
    }
  },

  async getUserVehicles(userId: string) {
    try {
      const res = await api.get(`/api/vehicles/client/${userId}`);
      return res.data?.data ?? res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al obtener vehículos del usuario');
    }
  },

  async deleteVehicle(id: string) {
    try {
      const res = await api.delete(`/api/vehicles/${id}`);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al eliminar vehículo');
    }
  },

  async getBrands() {
    try {
      const res = await api.get('/api/brands');
      return res.data?.data ?? res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al obtener marcas');
    }
  },

  async getModels(brandId?: string) {
    try {
      const res = await api.get('/api/models', {
        params: brandId && brandId.trim() !== '' ? { brandId } : undefined,
      });
      return res.data?.data !== undefined ? res.data.data : res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al obtener modelos');
    }
  },

  async createVehicle(userId: string, vehicleData: any) {
    try {
      const res = await api.post(`/api/vehicles/client/${userId}`, vehicleData);
      return res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al registrar vehículo');
    }
  },

  async getInsurances(insuranceId?: string) {
    try {
      const res = await api.get('/api/insurances', {
        params: insuranceId && insuranceId.trim() !== '' ? { insuranceId } : undefined,
      });
      return res.data?.data ?? res.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al obtener seguros');
    }
  },
};
