import { api } from './api';


export const getInvoicesByClientId = (clientId: string) => 
  api.get(`/api/billing/client/${clientId}`).then(res => res.data.data);
// Efectivo: amountReceived (tiene que cubrir el total). Otros medios: receiptNumber opcional del posnet o la app.
export const payInvoice = (invoiceId: string, paymentMethod: string, extra: { amountReceived?: number; receiptNumber?: string } = {}) =>
  api.post(`/api/billing/${invoiceId}/pay`, { paymentMethod, ...extra }).then(res => res.data);
