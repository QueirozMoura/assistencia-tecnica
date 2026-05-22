import { Order, Address } from '../types';
import { products } from './products';

export const mockAddresses: Address[] = [
  {
    id: 'addr-001',
    label: 'Casa',
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Jardim América',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-100',
    isDefault: true,
  },
  {
    id: 'addr-002',
    label: 'Trabalho',
    street: 'Av. Paulista',
    number: '1578',
    complement: 'Sala 1204',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-200',
    isDefault: false,
  },
];

export const mockOrders: Order[] = [
  {
    id: 'PED-2024-001',
    date: '2024-02-15',
    status: 'delivered',
    items: [
      { product: products[0], quantity: 1 },
    ],
    total: 1299.90,
    address: mockAddresses[0],
    paymentMethod: 'Cartão de Crédito - Final 4521',
    trackingCode: 'BR123456789SP',
  },
  {
    id: 'PED-2024-002',
    date: '2024-02-28',
    status: 'shipped',
    items: [
      { product: products[3], quantity: 1 },
    ],
    total: 2899.90,
    address: mockAddresses[0],
    paymentMethod: 'Pix',
    trackingCode: 'BR987654321SP',
  },
  {
    id: 'PED-2024-003',
    date: '2024-03-05',
    status: 'processing',
    items: [
      { product: products[8], quantity: 1 },
    ],
    total: 5499.90,
    address: mockAddresses[1],
    paymentMethod: 'Cartão de Crédito em 12x - Final 8832',
  },
];

export const mockUser = {
  id: 'user-001',
  name: 'João Felipe Queiroz',
  email: 'joao@email.com',
  phone: '(11) 99999-8888',
  cpf: '***.***.***-00',
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=JFQ&backgroundColor=2563eb&textColor=ffffff',
};
