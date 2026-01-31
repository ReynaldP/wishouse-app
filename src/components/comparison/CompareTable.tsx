import { memo, useMemo } from 'react';
import { Package, Calendar, Star, AlertTriangle, XCircle, ShoppingCart, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate, isOverdue } from '@/utils/format';
import {
  calculateComparisonHighlights,
  calculateProductScore,
  getHighlightForField,
  getHighlightClass
} from '@/utils/comparison';
import { useUpdateProductStatus } from '@/hooks/useProducts';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface CompareTableProps {
  products: Product[];
  currency: string;
  onProductDecision?: (productId: string, decision: 'to_buy' | 'pending') => void;
}

export const CompareTable = memo(function CompareTable({ products, currency }: CompareTableProps) {
  const highlights = useMemo(() => calculateComparisonHighlights(products), [products]);
  const scores = useMemo(() =>
    products.map(p => ({ id: p.id, score: calculateProductScore(p) })),
    [products]
  );
  const updateStatus = useUpdateProductStatus();

  const maxScore = Math.max(...scores.map(s => s.score));
  const bestProductId = scores.find(s => s.score === maxScore)?.id;

  const handleDecision = (productId: string, decision: 'to_buy' | 'pending') => {
    updateStatus.mutate({ id: productId, status: decision });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 sm:p-3 w-24 sm:w-32 text-xs sm:text-sm font-medium text-muted-foreground">
              Critere
            </th>
            {products.map(product => {
              const isBest = product.id === bestProductId;
              return (
                <th key={product.id} className={cn(
                  "p-2 sm:p-3 text-center min-w-[120px] sm:min-w-[150px]",
                  isBest && "bg-success/5"
                )}>
                  <div className="space-y-2">
                    <div className="relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg mx-auto"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-lg flex items-center justify-center mx-auto">
                          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                      )}
                      {isBest && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                          <Trophy className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-xs sm:text-sm line-clamp-2">{product.name}</p>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* Score */}
          <tr className="border-b bg-muted/30">
            <td className="p-3 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                Score
              </div>
            </td>
            {products.map(product => {
              const productScore = scores.find(s => s.id === product.id)?.score ?? 0;
              const isBest = productScore === maxScore;

              return (
                <td key={product.id} className="p-3 text-center">
                  <div className={cn(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold',
                    isBest ? 'bg-success/20 text-success' : 'bg-muted'
                  )}>
                    {productScore}
                    <span className="text-xs font-normal">/100</span>
                  </div>
                </td>
              );
            })}
          </tr>

          {/* Prix */}
          <tr className="border-b">
            <td className="p-3 text-sm font-medium">Prix</td>
            {products.map(product => {
              const highlightType = getHighlightForField(highlights, 'price', product.id);
              return (
                <td
                  key={product.id}
                  className={cn('p-3 text-center', getHighlightClass(highlightType))}
                >
                  <span className="text-lg font-bold">
                    {formatPrice(product.price, currency)}
                  </span>
                  {highlightType === 'best' && (
                    <span className="block text-xs text-success">Moins cher</span>
                  )}
                  {highlightType === 'worst' && (
                    <span className="block text-xs text-destructive">Plus cher</span>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Statut */}
          <tr className="border-b">
            <td className="p-3 text-sm font-medium">Statut</td>
            {products.map(product => {
              const config = STATUS_CONFIG[product.status];
              return (
                <td key={product.id} className="p-3 text-center">
                  <Badge className={cn(config.bgColor, config.color)}>
                    {config.label}
                  </Badge>
                </td>
              );
            })}
          </tr>

          {/* Priorité */}
          <tr className="border-b">
            <td className="p-3 text-sm font-medium">Priorité</td>
            {products.map(product => {
              const config = PRIORITY_CONFIG[product.priority];
              const highlightType = getHighlightForField(highlights, 'priority', product.id);
              return (
                <td
                  key={product.id}
                  className={cn('p-3 text-center', getHighlightClass(highlightType))}
                >
                  <span className={cn('font-medium', config.color)}>
                    {config.label}
                  </span>
                </td>
              );
            })}
          </tr>

          {/* Date planifiée */}
          <tr className="border-b">
            <td className="p-3 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date prévue
              </div>
            </td>
            {products.map(product => {
              const overdue = isOverdue(product.planned_date);
              const highlightType = getHighlightForField(highlights, 'planned_date', product.id);
              return (
                <td
                  key={product.id}
                  className={cn('p-3 text-center', getHighlightClass(highlightType))}
                >
                  {product.planned_date ? (
                    <div className={cn('flex items-center justify-center gap-1', overdue && 'text-destructive')}>
                      {overdue && <AlertTriangle className="h-4 w-4" />}
                      <span>{formatDate(product.planned_date)}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Catégorie */}
          <tr className="border-b">
            <td className="p-3 text-sm font-medium">Catégorie</td>
            {products.map(product => (
              <td key={product.id} className="p-3 text-center">
                {product.category ? (
                  <div className="flex items-center justify-center gap-2">
                    <span>{product.category.icon}</span>
                    <span className="text-sm">{product.category.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
            ))}
          </tr>

          {/* Avantages */}
          <tr className="border-b">
            <td className="p-3 text-sm font-medium text-success">Avantages</td>
            {products.map(product => (
              <td key={product.id} className="p-3 align-top">
                {product.pros ? (
                  <ul className="text-sm space-y-1">
                    {product.pros.split('\n').filter(l => l.trim()).map((pro, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-success">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground text-sm">Aucun</span>
                )}
              </td>
            ))}
          </tr>

          {/* Inconvénients */}
          <tr className="border-b">
            <td className="p-3 text-sm font-medium text-destructive">Inconvénients</td>
            {products.map(product => (
              <td key={product.id} className="p-3 align-top">
                {product.cons ? (
                  <ul className="text-sm space-y-1">
                    {product.cons.split('\n').filter(l => l.trim()).map((con, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-destructive">-</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground text-sm">Aucun</span>
                )}
              </td>
            ))}
          </tr>

          {/* Lien */}
          <tr className="border-b">
            <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium">Lien</td>
            {products.map(product => (
              <td key={product.id} className="p-2 sm:p-3 text-center">
                {product.link ? (
                  <a
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs sm:text-sm"
                  >
                    Voir
                  </a>
                ) : (
                  <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                )}
              </td>
            ))}
          </tr>

          {/* Decision Actions */}
          <tr className="bg-muted/30">
            <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-1">
                Decision
              </div>
            </td>
            {products.map(product => {
              const isBest = product.id === bestProductId;
              return (
                <td key={product.id} className={cn(
                  "p-2 sm:p-3 text-center",
                  isBest && "bg-success/5"
                )}>
                  <div className="flex flex-col gap-1.5">
                    <Button
                      size="sm"
                      variant={product.status === 'to_buy' ? 'default' : 'outline'}
                      className={cn(
                        "h-8 text-xs gap-1 w-full",
                        product.status === 'to_buy' && "bg-success hover:bg-success/90"
                      )}
                      onClick={() => handleDecision(product.id, 'to_buy')}
                      disabled={updateStatus.isPending}
                    >
                      <ShoppingCart className="h-3 w-3" />
                      <span className="hidden sm:inline">A acheter</span>
                      <span className="sm:hidden">Oui</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={product.status === 'pending' ? 'default' : 'outline'}
                      className={cn(
                        "h-8 text-xs gap-1 w-full",
                        product.status === 'pending' && "bg-muted-foreground hover:bg-muted-foreground/90"
                      )}
                      onClick={() => handleDecision(product.id, 'pending')}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="h-3 w-3" />
                      <span className="hidden sm:inline">En attente</span>
                      <span className="sm:hidden">Non</span>
                    </Button>
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      {/* Recommendation Banner */}
      {bestProductId && (
        <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center gap-2 text-success">
            <Trophy className="h-4 w-4" />
            <span className="font-medium text-sm">
              Recommandation : {products.find(p => p.id === bestProductId)?.name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ce produit a obtenu le meilleur score global ({maxScore}/100)
          </p>
        </div>
      )}
    </div>
  );
});
