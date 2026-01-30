import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Package } from 'lucide-react';
import { formatPrice, formatRelativeDate } from '@/utils/format';
import { STATUS_CONFIG } from '@/lib/constants';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface RecentProductsProps {
  products: Product[];
}

export const RecentProducts = memo(function RecentProducts({
  products,
}: RecentProductsProps) {
  const navigate = useNavigate();

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Produits récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun produit ajouté récemment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Produits récents</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => navigate(ROUTES.PRODUCTS)}
        >
          Voir tout
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => {
            const statusConfig = STATUS_CONFIG[product.status];
            return (
              <div
                key={product.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(ROUTES.PRODUCTS)}
              >
                {/* Image */}
                <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {product.category && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: product.category.color }}
                      />
                    )}
                    <p className="font-medium truncate">{product.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(product.created_at)}
                  </p>
                </div>

                {/* Price and status */}
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">{formatPrice(product.price)}</p>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', statusConfig.color)}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
