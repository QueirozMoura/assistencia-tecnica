import { api } from './api';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  address?: string;
  createdAt?: string;
}

export type CreateClientData = Omit<Client, 'id' | 'createdAt'>;
export type UpdateClientData = Partial<CreateClientData>;

export const clientService = {
  async getAllClients(): Promise<Client[]> {
    const { data } = await api.get<Client[]>('/clients');
    return data;
  },

  async getClientById(id: string): Promise<Client> {
    const { data } = await api.get<Client>(`/clients/${id}`);
    return data;
  },

  async createClient(payload: CreateClientData): Promise<Client> {
    const { data } = await api.post<Client>('/clients', payload);
    return data;
  },

  async updateClient(id: string, payload: UpdateClientData): Promise<Client> {
    const { data } = await api.put<Client>(`/clients/${id}`, payload);
    return data;
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
