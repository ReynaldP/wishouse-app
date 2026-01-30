import { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useFilterStore } from '@/stores/useFilterStore';
import { useUIStore } from '@/stores/useUIStore';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductDetail } from '@/components/products/ProductDetail';
import { ProductFilters } from '@/components/products/ProductFilters';
import { QuickFilters } from '@/components/products/QuickFilters';
import { CompareToolbar, CompareView } from '@/components/comparison';
import type { Product } from '@/types';

export function Products() {
  const { filters } = useFilterStore();
  const {
    setProductFormOpen,
    setEditingProductId,
    filtersOpen,
    setFiltersOpen,
    sortBy,
    sortOrder,
  } = useUIStore();

  const { data: products = [], isLoading } = useProducts(filters);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'planned_date':
          if (!a.planned_date && !b.planned_date) comparison = 0;
          else if (!a.planned_date) comparison = 1;
          else if (!b.planned_date) comparison = -1;
          else comparison = new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        default:
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [products, sortBy, sortOrder]);

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id);
    setProductFormOpen(true);
  };

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Compare toolbar */}
      <CompareToolbar />

      {/* Quick filters */}
      <QuickFilters />

      {/* Products grid */}
      <ProductGrid
        products={sortedProducts}
        isLoading={isLoading}
        onEdit={handleEdit}
        onSelect={handleSelect}
        onAddProduct={() => setProductFormOpen(true)}
      />

      {/* Product detail sheet */}
      <ProductDetail
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
      />

      {/* Filters sheet */}
      <ProductFilters open={filtersOpen} onOpenChange={setFiltersOpen} />

      {/* Compare view */}
      <CompareView />
    </div>
  );
}
