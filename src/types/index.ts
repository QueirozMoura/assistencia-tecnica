export type ProductCategory =
  | 'microondas'
  | 'maquina-de-lavar'
  | 'secadora'
  | 'lava-e-seca'
  | 'geladeira';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  installments: number;
  installmentValue: number;
  rating: number;
  reviewCount: number;
  images: string[];
  badge?: string;
  badgeColor?: string;
  inStock: boolean;
  stockCount?: number;
  description: string;
  shortDescription: string;
  specs: ProductSpec[];
  warranty: string;
  features: string[];
  reviews: ProductReview[];
  isNew?: boolean;
  isFeatured?: boolean;
  discount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  cpf?: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: CartItem[];
  total: number;
  address: Address;
  paymentMethod: string;
  trackingCode?: string;
}

export interface CheckoutStep {
  id: number;
  label: string;
  completed: boolean;
}

export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'boleto';

export interface FilterState {
  category: ProductCategory | 'all';
  brand: string[];
  priceRange: [number, number];
  rating: number | null;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  inStockOnly: boolean;
}
