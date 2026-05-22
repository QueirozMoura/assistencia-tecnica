import { useMemo } from 'react';
import { products } from '../data/products';
import { Product, FilterState } from '../types';

export function useProducts(filters?: Partial<FilterState>) {
  return useMemo(() => {
    let filtered = [...products];

    if (filters?.category && filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters?.brand && filters.brand.length > 0) {
      filtered = filtered.filter(p => filters.brand!.includes(p.brand));
    }

    if (filters?.priceRange) {
      const [min, max] = filters.priceRange;
      filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }

    if (filters?.rating !== null && filters?.rating !== undefined) {
      filtered = filtered.filter(p => p.rating >= filters.rating!);
    }

    if (filters?.inStockOnly) {
      filtered = filtered.filter(p => p.inStock);
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
          break;
        default:
          filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      }
    }

    return filtered;
  }, [filters]);
}

export function useProduct(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function useRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

export function useSearchProducts(query: string): Product[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return products.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q)
  );
}
