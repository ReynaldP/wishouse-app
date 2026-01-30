import { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, AlertTriangle } from 'lucide-react';
import { formatPrice, formatDate, isOverdue } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface UpcomingPurchasesProps {
  products: Product[];
}

export const UpcomingPurchases = memo(function UpcomingPurchases({
  products,
}: UpcomingPurchasesProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Achats prévus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun achat prévu prochainement
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Achats prévus
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product) => {
            const overdue = isOverdue(product.planned_date);
            return (
              <div
                key={product.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  overdue && 'border-destructive bg-destructive/5'
                )}
              >
                {/* Image */}
                <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{product.name}</p>
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      overdue ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {overdue && <AlertTriangle className="h-3 w-3" />}
                    <span>{formatDate(product.planned_date!)}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm">
                    {formatPrice(product.price)}
                  </p>
                  {overdue && (
                    <Badge variant="destructive" className="text-xs">
                      En retard
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
