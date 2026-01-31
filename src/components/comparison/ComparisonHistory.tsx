import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Package, Trash2, ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useUIStore } from '@/stores/useUIStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ComparisonHistoryProps {
  onSelectComparison: (productIds: string[]) => void;
}

export const ComparisonHistory = memo(function ComparisonHistory({
  onSelectComparison,
}: ComparisonHistoryProps) {
  const { comparisonHistory, clearComparisonHistory } = useUIStore();
  const { data: allProducts = [] } = useProducts();

  if (comparisonHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-2">Aucun historique</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Vos comparaisons seront sauvegardées ici pour un accès rapide
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {comparisonHistory.length} comparaison{comparisonHistory.length > 1 ? 's' : ''} sauvegardée{comparisonHistory.length > 1 ? 's' : ''}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearComparisonHistory}
          className="text-destructive hover:text-destructive gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Effacer tout
        </Button>
      </div>

      {/* History list */}
      <div className="space-y-3">
        {comparisonHistory.map((item) => {
          // Find products for this comparison
          const products = item.productIds
            .map(id => allProducts.find(p => p.id === id))
            .filter((p): p is NonNullable<typeof p> => p !== undefined);

          const winner = products.find(p => p.id === item.winnerId);
          const availableCount = products.length;
          const missingCount = item.productIds.length - availableCount;

          return (
            <Card
              key={item.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                availableCount < 2 && 'opacity-50'
              )}
              onClick={() => availableCount >= 2 && onSelectComparison(item.productIds)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  {/* Product images preview */}
                  <div className="flex -space-x-2 flex-shrink-0">
                    {products.slice(0, 3).map((product, i) => (
                      <div
                        key={product.id}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-background overflow-hidden bg-muted"
                        style={{ zIndex: 3 - i }}
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {products.length > 3 && (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                        +{products.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {item.productIds.length} produits
                      </Badge>
                      {missingCount > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          {missingCount} supprimé{missingCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {/* Product names */}
                    <p className="text-sm font-medium line-clamp-1">
                      {products.map(p => p.name).join(' vs ')}
                    </p>

                    {/* Winner & time */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      {winner && (
                        <span className="flex items-center gap-1 text-success">
                          <Trophy className="h-3 w-3" />
                          {winner.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    disabled={availableCount < 2}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});
