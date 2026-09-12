export interface ServicePrice {
  id: string;
  price: number;
  expirationDate: string | null;
  startDate: string;
  serviceCatalog: {
    id: string;
    name: string;
    description: string;
  };
}