import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getInvoicesByClientId = (clientId: string) => 
  api.get(`/api/billing/client/${clientId}`).then(res => res.data.data);

