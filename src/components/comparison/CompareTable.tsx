import { memo, useMemo } from 'react';
import { Package, Calendar, AlertTriangle, XCircle, ShoppingCart, Trophy, Tag } from 'lucide-react';
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
import type { Product, AIComparisonResult } from '@/types';
import { Sparkles, Trophy as TrophyAI } from 'lucide-react';

interface CompareTableProps {
  products: Product[];
  currency: string;
  onProductDecision?: (productId: string, decision: 'to_buy' | 'pending') => void;
  aiComparisonResult?: AIComparisonResult | null;
}

export const CompareTable = memo(function CompareTable({ products, currency, aiComparisonResult }: CompareTableProps) {
  const highlights = useMemo(() => calculateComparisonHighlights(products), [products]);
  const scores = useMemo(() =>
    products.map(p => ({ id: p.id, score: calculateProductScore(p) })),
    [products]
  );
  const updateStatus = useUpdateProductStatus();

  // Map AI results by product ID for easy lookup
  const aiResultsMap = useMemo(() => {
    if (!aiComparisonResult?.results) return new Map();
    return new Map(aiComparisonResult.results.map(r => [r.productId, r]));
  }, [aiComparisonResult]);

  // Determine best product: use AI score if available, otherwise fallback to classic score
  const bestProductId = useMemo(() => {
    if (aiComparisonResult?.results) {
      // Find the product marked as best choice by AI
      const aiBest = aiComparisonResult.results.find(r => r.isBestChoice);
      if (aiBest) return aiBest.productId;
      // Fallback: highest AI score
      const maxAIScore = Math.max(...aiComparisonResult.results.map(r => r.adjustedScore));
      return aiComparisonResult.results.find(r => r.adjustedScore === maxAIScore)?.productId;
    }
    // No AI results, use classic score
    const maxScore = Math.max(...scores.map(s => s.score));
    return scores.find(s => s.score === maxScore)?.id;
  }, [aiComparisonResult, scores]);

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
          {/* Score IA - Only show if AI comparison exists */}
          {aiComparisonResult && (
            <tr className="border-b bg-primary/5">
              <td className="p-3 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Score IA
                </div>
              </td>
              {products.map(product => {
                const aiResult = aiResultsMap.get(product.id);
                const aiScore = aiResult?.adjustedScore ?? 0;
                const isAIBest = aiResult?.isBestChoice;

                return (
                  <td key={product.id} className={cn("p-3 text-center", isAIBest && "bg-primary/10")}>
                    <div className="space-y-1">
                      <div className={cn(
                        'inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold',
                        isAIBest ? 'bg-primary/20 text-primary' : 'bg-muted'
                      )}>
                        {aiScore}
                        <span className="text-xs font-normal">/100</span>
                      </div>
                      {isAIBest && (
                        <div className="flex items-center justify-center gap-1 text-xs text-primary font-medium">
                          <TrophyAI className="h-3 w-3" />
                          Meilleur choix IA
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          )}

          {/* Justification IA - Only show if AI comparison exists */}
          {aiComparisonResult && (
            <tr className="border-b">
              <td className="p-3 text-sm font-medium">
                <div className="flex items-center gap-2 text-muted-foreground">
                  Justification IA
                </div>
              </td>
              {products.map(product => {
                const aiResult = aiResultsMap.get(product.id);
                return (
                  <td key={product.id} className="p-3 align-top">
                    <p className="text-sm text-muted-foreground">
                      {aiResult?.justification || '-'}
                    </p>
                  </td>
                );
              })}
            </tr>
          )}

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

          {/* Tags */}
          <tr className="border-b">
            <td className="p-3 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </div>
            </td>
            {products.map(product => (
              <td key={product.id} className="p-3">
                {product.tags && product.tags.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-1">
                    {product.tags.map(tag => (
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
                  </div>
                ) : (
                  <span className="text-muted-foreground text-center block">-</span>
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
        <div className={cn(
          "mt-4 p-3 rounded-lg border",
          aiComparisonResult ? "bg-primary/10 border-primary/20" : "bg-success/10 border-success/20"
        )}>
          <div className={cn(
            "flex items-center gap-2",
            aiComparisonResult ? "text-primary" : "text-success"
          )}>
            {aiComparisonResult ? <Sparkles className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
            <span className="font-medium text-sm">
              {aiComparisonResult ? 'Recommandation IA' : 'Recommandation'} : {products.find(p => p.id === bestProductId)?.name}
            </span>
          </div>
          {aiComparisonResult ? (
            <p className="text-sm text-muted-foreground mt-2">
              {aiResultsMap.get(bestProductId)?.justification}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Ce produit a obtenu le meilleur score global
            </p>
          )}
        </div>
      )}
    </div>
  );
});
