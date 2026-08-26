const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const vehicleService = {
  async getVehicles(userId: string) {
    const res = await fetch(`${API_URL}/api/vehicles/client/${userId}`);
    if (!res.ok) throw new Error('Error al obtener vehículos');
    const data = await res.json();
    return data.data || data;
  },

  async getBrands() {
    const res = await fetch(`${API_URL}/api/brands`);
    if (!res.ok) throw new Error('Error al obtener marcas');
    const data = await res.json();
    return data.data || data;
  },

  async getModels(brandId?: string) {
    const url = brandId && brandId.trim() !== '' 
      ? `${API_URL}/api/models?brandId=${brandId}` 
      : `${API_URL}/api/models`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Error al obtener modelos');
    }
    const json = await res.json();
    
    return json.data !== undefined ? json.data : json;
  },

  async createVehicle(userId: string, vehicleData: any) {
    const res = await fetch(`${API_URL}/api/vehicles/client/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleData),
    });
    
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Error al registrar vehículo');
    }
    return json;
  },
  
  async getInsurances(insuranceId?: string) {
    const url = insuranceId && insuranceId.trim() !== ''
      ? `${API_URL}/api/insurances?insuranceId=${insuranceId}` 
      : `${API_URL}/api/insurances`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al obtener seguros');
    const json = await res.json();
    return json.data || json;
  }
};