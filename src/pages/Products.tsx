import { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { useFilterStore } from '@/stores/useFilterStore';
import { useUIStore } from '@/stores/useUIStore';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductDetail } from '@/components/products/ProductDetail';
import { ProductFilters } from '@/components/products/ProductFilters';
import { QuickFilters } from '@/components/products/QuickFilters';
import { CompareToolbar, CompareView } from '@/components/comparison';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/utils/format';
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
  const { data: settings } = useSettings();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const currency = settings?.currency || 'EUR';

  // Calculate stats for expense products only (to_buy + purchased)
  const stats = useMemo(() => {
    const toBuy = products.filter(p => p.status === 'to_buy');
    const purchased = products.filter(p => p.status === 'purchased');
    const pending = products.filter(p => p.status === 'pending');
    const expenseTotal = [...toBuy, ...purchased].reduce((sum, p) => sum + p.price, 0);
    return {
      total: products.length,
      toBuyCount: toBuy.length,
      purchasedCount: purchased.length,
      pendingCount: pending.length,
      expenseTotal
    };
  }, [products]);

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
    <div className="space-y-3 sm:space-y-6 pb-6">
      {/* Header with stats - compact on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Produits</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {stats.total} produit{stats.total !== 1 ? 's' : ''} • Budget engagé: {formatPrice(stats.expenseTotal, currency)}
          </p>
        </div>
        {/* Quick stats badges - visible on mobile */}
        <div className="flex gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-success/10 text-success border-success/30">
            {stats.purchasedCount} acheté{stats.purchasedCount !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-warning/10 text-warning border-warning/30">
            {stats.toBuyCount} à acheter
          </Badge>
          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 bg-muted">
            {stats.pendingCount} en attente
          </Badge>
        </div>
      </div>

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
