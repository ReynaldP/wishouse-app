import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Package,
  ThumbsUp,
  ThumbsDown,
  ShoppingCart,
  Check,
} from 'lucide-react';
import { formatPrice, formatDateLong, isOverdue } from '@/utils/format';
import {
  useToggleFavorite,
  useDeleteProduct,
  useUpdateProductStatus,
} from '@/hooks/useProducts';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import type { Product, Status } from '@/types';

interface ProductDetailProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: Product) => void;
}

export function ProductDetail({
  product,
  open,
  onOpenChange,
  onEdit,
}: ProductDetailProps) {
  const toggleFavorite = useToggleFavorite();
  const deleteProduct = useDeleteProduct();
  const updateStatus = useUpdateProductStatus();

  if (!product) return null;

  const handleDelete = () => {
    if (confirm('Supprimer ce produit ?')) {
      deleteProduct.mutate(product.id);
      onOpenChange(false);
    }
  };

  const handleStatusChange = (status: Status) => {
    updateStatus.mutate({ id: product.id, status });
  };

  const overdue = isOverdue(product.planned_date) && product.status !== 'purchased';
  const statusConfig = STATUS_CONFIG[product.status];
  const priorityConfig = PRIORITY_CONFIG[product.priority];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

        {/* Image */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <SheetHeader className="text-left mb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {/* Category */}
              {product.category && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: product.category.color }}
                  />
                  <span>{product.category.name}</span>
                  {product.subcategory && (
                    <span>• {product.subcategory.name}</span>
                  )}
                </div>
              )}
              <SheetTitle className="text-xl">{product.name}</SheetTitle>
            </div>

            {/* Favorite */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => toggleFavorite.mutate(product.id)}
            >
              <Heart
                className={cn(
                  'h-6 w-6',
                  product.is_favorite && 'fill-red-500 text-red-500'
                )}
              />
            </Button>
          </div>
        </SheetHeader>

        {/* Price */}
        <div className="text-3xl font-bold text-primary mb-4">
          {formatPrice(product.price)}
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>
            {statusConfig.label}
          </Badge>
          <Badge
            variant="outline"
            className={priorityConfig.color}
          >
            Priorité {priorityConfig.label.toLowerCase()}
          </Badge>
          {overdue && (
            <Badge variant="destructive">En retard</Badge>
          )}
        </div>

        {/* Quick actions - Status change */}
        <div className="flex gap-2 mb-6">
          {product.status !== 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('pending')}
            >
              En attente
            </Button>
          )}
          {product.status !== 'to_buy' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => handleStatusChange('to_buy')}
            >
              <ShoppingCart className="h-4 w-4" />
              À acheter
            </Button>
          )}
          {product.status !== 'purchased' && (
            <Button
              variant="default"
              size="sm"
              className="gap-1"
              onClick={() => handleStatusChange('purchased')}
            >
              <Check className="h-4 w-4" />
              Acheté
            </Button>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Planned date */}
        {product.planned_date && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Date prévue</h4>
            <div
              className={cn(
                'flex items-center gap-2',
                overdue && 'text-destructive'
              )}
            >
              <Calendar className="h-4 w-4" />
              <span>{formatDateLong(product.planned_date)}</span>
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}

        {/* Pros and Cons */}
        {(product.pros || product.cons) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {product.pros && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-success">
                  <ThumbsUp className="h-4 w-4" />
                  Points positifs
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {product.pros}
                </p>
              </div>
            )}
            {product.cons && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-destructive">
                  <ThumbsDown className="h-4 w-4" />
                  Points négatifs
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {product.cons}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Link */}
        {product.link && (
          <div className="mb-6">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(product.link, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Voir le produit
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              onEdit(product);
              onOpenChange(false);
            }}
          >
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
