import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onEdit: (product: Product) => void;
  onSelect: (product: Product) => void;
  onAddProduct?: () => void;
}

export const ProductGrid = memo(function ProductGrid({
  products,
  isLoading,
  onEdit,
  onSelect,
  onAddProduct,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductGridSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aucun produit"
        description="Commencez par ajouter votre premier produit pour planifier votre budget."
        actionLabel="Ajouter un produit"
        onAction={onAddProduct}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
      <AnimatePresence mode="popLayout">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onClick={onSelect}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

function ProductGridSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="aspect-[4/3] sm:aspect-video w-full" />
      <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3">
        <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
        <Skeleton className="h-4 sm:h-5 w-full" />
        <Skeleton className="h-5 sm:h-8 w-16 sm:w-20" />
        <div className="flex justify-between pt-2 border-t">
          <Skeleton className="h-5 sm:h-6 w-14 sm:w-16" />
          <div className="flex gap-0.5">
            <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
            <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
