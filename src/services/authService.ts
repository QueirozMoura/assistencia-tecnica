import { api } from './api';
import { storage } from '../utils/storage';
import type { AuthUser, AuthResponse, LoginPayload, RegisterPayload } from '../types/auth';

export const authService = {
  async login(credentials: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    storage.setToken(data.token);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    storage.setToken(data.token);
    return data;
  },

  async getMe(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>('/auth/me');
    return data;
  },

  logout(): void {
    storage.clear();
  },
};
