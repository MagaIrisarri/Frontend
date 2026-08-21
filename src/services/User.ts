import axios from "axios";
import type { formInitialState } from "../types/UserType.data.ts";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getUser = () => api.get("/api/users").then(res => res.data);
export const getUserId = (id: string) => api.get(`/api/users/${id}`).then(res => res.data);
export const createUser = (datos: typeof formInitialState) => api.post("/api/users", datos).then(res => res.data);
export const updateUser = (id: string, datos: Partial<typeof formInitialState>) => api.put(`/api/users/${id}`, datos).then(res => res.data);
export const removeUser = (id: string) => api.delete(`/api/users/${id}`).then(res => res.data);
export const loginUser = (email: string, password: string) => api.post("/api/users/login", { email, password }).then(res => res.data);
export const changePassword = (id: string, currentPassword: string, newPassword: string) => api.patch(`/api/users/${id}/password`, { currentPassword, newPassword }).then(res => res.data);