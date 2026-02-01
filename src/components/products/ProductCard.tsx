import { memo, forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Package,
} from 'lucide-react';
import { formatPrice, formatDate, isOverdue } from '@/utils/format';
import { useToggleFavorite, useDeleteProduct } from '@/hooks/useProducts';
import { useUIStore } from '@/stores/useUIStore';
import { ProductSelector } from '@/components/comparison/ProductSelector';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG } from '@/lib/constants';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onClick: (product: Product) => void;
}

export const ProductCard = memo(forwardRef<HTMLDivElement, ProductCardProps>(function ProductCard({
  product,
  onEdit,
  onClick,
}, ref) {
  const toggleFavorite = useToggleFavorite();
  const deleteProduct = useDeleteProduct();
  const {
    comparisonMode,
    comparisonProductIds,
    toggleProductComparison
  } = useUIStore();

  const isSelectedForComparison = comparisonProductIds.includes(product.id);
  const isComparisonDisabled = !isSelectedForComparison && comparisonProductIds.length >= 4;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate(product.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer ce produit ?')) {
      deleteProduct.mutate(product.id);
    }
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.link) {
      window.open(product.link, '_blank');
    }
  };

  const overdue = isOverdue(product.planned_date) && product.status !== 'purchased';
  const statusConfig = STATUS_CONFIG[product.status];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <Card
        className={cn(
          'overflow-hidden cursor-pointer card-interactive',
          overdue && 'border-destructive',
          `priority-${product.priority}`
        )}
        onClick={() => onClick(product)}
      >
        {/* Image - smaller aspect ratio on mobile */}
        <div className="relative aspect-[4/3] sm:aspect-video bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
            </div>
          )}

          {/* Comparison selector */}
          <AnimatePresence>
            {comparisonMode && (
              <ProductSelector
                isSelected={isSelectedForComparison}
                isDisabled={isComparisonDisabled}
                onToggle={() => toggleProductComparison(product.id)}
              />
            )}
          </AnimatePresence>

          {/* Favorite button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-background/80 backdrop-blur"
            onClick={handleToggleFavorite}
          >
            <Heart
              className={cn(
                'h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors',
                product.is_favorite && 'fill-red-500 text-red-500'
              )}
            />
          </Button>

          {/* Priority badge */}
          {product.priority === 'high' && (
            <Badge className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[10px] sm:text-xs px-1.5 py-0" variant="destructive">
              Prioritaire
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Category */}
          {product.category && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: product.category.color }}
              />
              <span className="truncate">{product.category.name}</span>
              {product.subcategory && (
                <span className="text-xs truncate">
                  • {product.subcategory.name}
                </span>
              )}
            </div>
          )}

          {/* Name */}
          <h3 className="font-semibold line-clamp-2 leading-tight text-base">
            {product.name}
          </h3>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                  style={{
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {product.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  +{product.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Price and date row */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {formatPrice(product.price)}
            </div>

            {/* Planned date */}
            {product.planned_date && (
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  overdue
                    ? 'text-destructive font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <Calendar className="w-4 h-4" />
                <span>{formatDate(product.planned_date)}</span>
              </div>
            )}
          </div>

          {/* Status and actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <Badge className={cn(statusConfig.bgColor, statusConfig.color, "text-xs px-2 py-0.5")}>
              {statusConfig.label}
            </Badge>

            <div className="flex gap-0.5">
              {product.link && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleOpenLink}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}));
