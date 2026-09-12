export interface Service {
  id: string,
  name: string,
  description: string,
  isActive: boolean,
}
export interface ServiceInput {
  name: string,
  description: string,
}