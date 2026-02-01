import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Plus, Package, Sparkles } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { getSiteName, getSearchUrl, type SupportedSite } from '@/utils/webClipper';
import type { Recommendation } from '@/types';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  recommendation: Recommendation;
  currentPrice?: number;
  currency?: string;
  onAdd?: (recommendation: Recommendation) => void;
  isAdding?: boolean;
}

export const RecommendationCard = memo(function RecommendationCard({
  recommendation,
  currentPrice,
  currency = 'EUR',
  onAdd,
  isAdding = false
}: RecommendationCardProps) {
  const priceDiff = currentPrice
    ? recommendation.price - currentPrice
    : null;
  const priceDiffPercent = currentPrice && currentPrice > 0
    ? ((recommendation.price - currentPrice) / currentPrice) * 100
    : null;

  const isCheaper = priceDiff !== null && priceDiff < 0;
  const siteName = getSiteName(recommendation.source);

  const handleOpenLink = () => {
    if (recommendation.link) {
      window.open(recommendation.link, '_blank');
    } else {
      // If no direct link, open search on the site
      const searchUrl = getSearchUrl(
        recommendation.source as SupportedSite,
        recommendation.name
      );
      window.open(searchUrl, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Image */}
      <div className="relative aspect-video bg-muted">
        {recommendation.image_url ? (
          <img
            src={recommendation.image_url}
            alt={recommendation.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
        )}

        {/* Relevance score badge */}
        <Badge
          className={cn(
            'absolute top-2 right-2 gap-1',
            recommendation.relevance_score >= 80
              ? 'bg-green-500'
              : recommendation.relevance_score >= 60
              ? 'bg-amber-500'
              : 'bg-gray-500'
          )}
        >
          <Sparkles className="h-3 w-3" />
          {recommendation.relevance_score}%
        </Badge>

        {/* Source badge */}
        <Badge variant="secondary" className="absolute top-2 left-2">
          {siteName}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name */}
        <h4 className="font-medium text-sm line-clamp-2 leading-tight">
          {recommendation.name}
        </h4>

        {/* AI Reason */}
        {recommendation.ai_reason && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {recommendation.ai_reason}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(recommendation.price, currency)}
          </span>
          {priceDiffPercent !== null && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                isCheaper
                  ? 'border-green-500 text-green-600'
                  : 'border-red-500 text-red-600'
              )}
            >
              {isCheaper ? '' : '+'}{priceDiffPercent.toFixed(0)}%
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={handleOpenLink}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir
          </Button>
          {onAdd && (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => onAdd(recommendation)}
              disabled={isAdding}
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});
