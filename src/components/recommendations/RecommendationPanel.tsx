import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';
import { RecommendationCard } from './RecommendationCard';
import {
  useFetchRecommendations,
  useAIRecommendations,
  useAddRecommendationAsProduct
} from '@/hooks/useAIRecommendations';
import {
  SUPPORTED_SITES,
  openSearchInNewTab,
  type SupportedSite
} from '@/utils/webClipper';
import type { Product, Recommendation } from '@/types';

interface RecommendationPanelProps {
  product: Product;
  currency?: string;
}

export const RecommendationPanel = memo(function RecommendationPanel({
  product,
  currency = 'EUR'
}: RecommendationPanelProps) {
  const { data, isLoading } = useAIRecommendations(product, false);
  const fetchRecommendations = useFetchRecommendations();
  const addAsProduct = useAddRecommendationAsProduct();

  const recommendations = data?.recommendations || [];
  const hasRecommendations = recommendations.length > 0;

  const handleFetchRecommendations = () => {
    fetchRecommendations.mutate(product);
  };

  const handleAddRecommendation = (recommendation: Recommendation) => {
    addAsProduct.mutate(recommendation);
  };

  const handleSearchOnSite = (site: SupportedSite) => {
    openSearchInNewTab(site, product.name);
  };

  return (
    <div className="space-y-4">
      {/* Header with fetch button */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Alternatives IA</h4>
          <p className="text-xs text-muted-foreground">
            Suggestions de produits similaires
          </p>
        </div>

        <Button
          variant={hasRecommendations ? 'outline' : 'default'}
          size="sm"
          onClick={handleFetchRecommendations}
          disabled={fetchRecommendations.isPending || isLoading}
          className="gap-1"
        >
          {fetchRecommendations.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasRecommendations ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {hasRecommendations ? 'Actualiser' : 'Trouver des alternatives'}
        </Button>
      </div>

      {/* Loading state */}
      {(fetchRecommendations.isPending || isLoading) && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">Recherche d'alternatives en cours...</p>
          <p className="text-xs">L'IA analyse les meilleurs produits pour vous</p>
        </div>
      )}

      {/* Error state */}
      {data?.error && !fetchRecommendations.isPending && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm text-destructive mb-2">{data.error}</p>
          <p className="text-xs">
            Vérifiez que la clé API Anthropic est configurée dans Supabase
          </p>
        </div>
      )}

      {/* Recommendations grid */}
      {hasRecommendations && !fetchRecommendations.isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendations.map((rec, index) => (
            <RecommendationCard
              key={`${rec.source}-${index}`}
              recommendation={rec}
              currentPrice={product.price}
              currency={currency}
              onAdd={handleAddRecommendation}
              isAdding={addAsProduct.isPending}
            />
          ))}
        </div>
      )}

      {/* Manual search section */}
      <div className="border-t pt-4 mt-4">
        <h5 className="text-sm font-medium mb-2">Recherche manuelle</h5>
        <p className="text-xs text-muted-foreground mb-3">
          Cliquez sur un site pour rechercher "{product.name}"
        </p>

        <div className="flex flex-wrap gap-2">
          {SUPPORTED_SITES.map(site => (
            <Button
              key={site.key}
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => handleSearchOnSite(site.key)}
            >
              <ExternalLink className="h-3 w-3" />
              {site.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Info about AI */}
      {!hasRecommendations && !fetchRecommendations.isPending && !data?.error && (
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Cliquez sur "Trouver des alternatives" pour que l'IA vous suggère
            des produits similaires sur les principaux sites e-commerce.
          </p>
        </div>
      )}
    </div>
  );
});
