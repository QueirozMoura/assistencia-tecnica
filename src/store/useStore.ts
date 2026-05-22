import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, User, FilterState } from '../types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  appliedCoupon: string | null;
  discount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

interface UIStore {
  isSearchOpen: boolean;
  searchQuery: string;
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, _password: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, _password: string) => boolean;
}

interface FilterStore {
  filters: FilterState;
  setCategory: (category: FilterState['category']) => void;
  setSortBy: (sortBy: FilterState['sortBy']) => void;
  setPriceRange: (range: [number, number]) => void;
  setRating: (rating: number | null) => void;
  toggleBrand: (brand: string) => void;
  toggleInStockOnly: () => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  category: 'all',
  brand: [],
  priceRange: [0, 15000],
  rating: null,
  sortBy: 'relevance',
  inStockOnly: false,
};

const VALID_COUPONS: Record<string, number> = {
  'JFQ10': 10,
  'PROMO15': 15,
  'FIRST20': 20,
  'VERAO5': 5,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      discount: 0,

      addItem: (product) => {
        set((state) => {
          const existing = state.items.find(i => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + 1, 10) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(i => i.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map(i =>
            i.product.id === productId
              ? { ...i, quantity: Math.min(quantity, 10) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [], appliedCoupon: null, discount: 0 }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotalPrice: () => {
        const subtotal = get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        const discountAmount = subtotal * (get().discount / 100);
        return subtotal - discountAmount;
      },

      applyCoupon: (code: string) => {
        const discountPercent = VALID_COUPONS[code.toUpperCase()];
        if (discountPercent) {
          set({ appliedCoupon: code.toUpperCase(), discount: discountPercent });
          return true;
        }
        return false;
      },

      removeCoupon: () => set({ appliedCoupon: null, discount: 0 }),
    }),
    { name: 'jfq-cart' }
  )
);

export const useUIStore = create<UIStore>((set) => ({
  isSearchOpen: false,
  searchQuery: '',
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  isMenuOpen: false,
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
}));

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: (email: string, _password: string) => {
        // Fake authentication - always succeeds with any valid email format
        if (email && email.includes('@')) {
          set({
            isAuthenticated: true,
            user: {
              id: 'user-001',
              name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              email,
            },
          });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false, user: null }),

      register: (name: string, email: string, _password: string) => {
        if (name && email && email.includes('@')) {
          set({
            isAuthenticated: true,
            user: { id: 'user-new', name, email },
          });
          return true;
        }
        return false;
      },
    }),
    { name: 'jfq-auth' }
  )
);

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,

  setCategory: (category) =>
    set((state) => ({ filters: { ...state.filters, category } })),

  setSortBy: (sortBy) =>
    set((state) => ({ filters: { ...state.filters, sortBy } })),

  setPriceRange: (range) =>
    set((state) => ({ filters: { ...state.filters, priceRange: range } })),

  setRating: (rating) =>
    set((state) => ({ filters: { ...state.filters, rating } })),

  toggleBrand: (brand) =>
    set((state) => ({
      filters: {
        ...state.filters,
        brand: state.filters.brand.includes(brand)
          ? state.filters.brand.filter(b => b !== brand)
          : [...state.filters.brand, brand],
      },
    })),

  toggleInStockOnly: () =>
    set((state) => ({
      filters: { ...state.filters, inStockOnly: !state.filters.inStockOnly },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
