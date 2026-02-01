import { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, RefreshCw, Bell, BellOff, Target, TrendingDown } from 'lucide-react';
import { PriceHistoryChart } from './PriceHistoryChart';
import { usePriceHistory, useAddPriceRecord, useUpdateProductPrice } from '@/hooks/usePriceHistory';
import { useUpdateProduct } from '@/hooks/useProducts';
import { checkProductPrice } from '@/utils/priceChecker';
import { formatPrice, formatRelativeDate } from '@/utils/format';
import { toast } from '@/hooks/useToast';
import type { Product } from '@/types';

interface PriceHistoryPanelProps {
  product: Product;
  currency?: string;
}

export const PriceHistoryPanel = memo(function PriceHistoryPanel({
  product,
  currency = 'EUR'
}: PriceHistoryPanelProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState(
    product.target_price?.toString() || ''
  );

  const { data: history = [], isLoading } = usePriceHistory(product.id);
  const addPriceRecord = useAddPriceRecord();
  const updateProduct = useUpdateProduct();
  const updateProductPrice = useUpdateProductPrice();

  const handleCheckPrice = useCallback(async () => {
    if (!product.link) {
      toast({
        title: 'Lien manquant',
        description: 'Ce produit n\'a pas de lien pour vérifier le prix',
        variant: 'destructive'
      });
      return;
    }

    setIsChecking(true);
    try {
      const result = await checkProductPrice(product);

      if (result.currentPrice !== null) {
        if (result.hasChanged) {
          // Update product price and record in history
          await updateProductPrice.mutateAsync({
            productId: product.id,
            newPrice: result.currentPrice,
            source: 'auto_check'
          });

          const changeText = result.percentChange < 0
            ? `${Math.abs(result.percentChange).toFixed(1)}% moins cher`
            : `${result.percentChange.toFixed(1)}% plus cher`;

          toast({
            title: 'Prix mis à jour',
            description: `Nouveau prix: ${formatPrice(result.currentPrice, currency)} (${changeText})`,
            variant: result.percentChange < 0 ? 'success' : 'default'
          });

          if (result.reachedTarget) {
            toast({
              title: 'Objectif atteint !',
              description: `Le prix de "${product.name}" a atteint votre cible !`,
              variant: 'success'
            });
          }
        } else {
          // Record the same price in history for tracking
          await addPriceRecord.mutateAsync({
            product_id: product.id,
            price: result.currentPrice,
            source: 'auto_check'
          });

          toast({
            title: 'Prix vérifié',
            description: `Le prix n'a pas changé: ${formatPrice(result.currentPrice, currency)}`,
          });
        }
      } else {
        toast({
          title: 'Impossible de récupérer le prix',
          description: 'Le site ne renvoie pas d\'information de prix',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de vérifier le prix',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  }, [product, currency, updateProductPrice, addPriceRecord]);

  const handleToggleAlert = useCallback(async () => {
    await updateProduct.mutateAsync({
      id: product.id,
      updates: {
        price_alert_enabled: !product.price_alert_enabled
      }
    });
  }, [product.id, product.price_alert_enabled, updateProduct]);

  const handleSetTargetPrice = useCallback(async () => {
    const targetPrice = parseFloat(targetPriceInput);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      toast({
        title: 'Prix invalide',
        description: 'Veuillez entrer un prix cible valide',
        variant: 'destructive'
      });
      return;
    }

    await updateProduct.mutateAsync({
      id: product.id,
      updates: {
        target_price: targetPrice,
        price_alert_enabled: true
      }
    });

    toast({
      title: 'Prix cible défini',
      description: `Vous serez alerté quand le prix atteindra ${formatPrice(targetPrice, currency)}`,
      variant: 'success'
    });
  }, [product.id, targetPriceInput, currency, updateProduct]);

  const handleClearTargetPrice = useCallback(async () => {
    await updateProduct.mutateAsync({
      id: product.id,
      updates: {
        target_price: null,
        price_alert_enabled: false
      }
    });
    setTargetPriceInput('');
  }, [product.id, updateProduct]);

  const lastCheck = history.length > 0
    ? history[history.length - 1].recorded_at
    : null;

  const potentialSavings = product.target_price
    ? Math.max(0, product.price - product.target_price)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current price and check button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{formatPrice(product.price, currency)}</p>
          {lastCheck && (
            <p className="text-xs text-muted-foreground">
              Dernière vérification: {formatRelativeDate(lastCheck)}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCheckPrice}
          disabled={isChecking || !product.link}
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Vérifier le prix
        </Button>
      </div>

      {/* Price history chart */}
      <div className="border rounded-lg p-4 bg-card">
        <h4 className="font-medium mb-3">Historique des prix</h4>
        <PriceHistoryChart
          history={history}
          currentPrice={product.price}
          targetPrice={product.target_price}
          currency={currency}
        />
      </div>

      {/* Target price settings */}
      <div className="border rounded-lg p-4 bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Prix cible</h4>
          </div>
          <div className="flex items-center gap-2">
            {product.price_alert_enabled ? (
              <Bell className="h-4 w-4 text-green-500" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <Switch
              checked={product.price_alert_enabled}
              onCheckedChange={handleToggleAlert}
              disabled={!product.target_price}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="target-price" className="sr-only">Prix cible</Label>
            <Input
              id="target-price"
              type="number"
              placeholder="Ex: 299.99"
              value={targetPriceInput}
              onChange={(e) => setTargetPriceInput(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleSetTargetPrice}
            disabled={!targetPriceInput}
          >
            Définir
          </Button>
          {product.target_price && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearTargetPrice}
            >
              <span className="sr-only">Supprimer</span>
              ×
            </Button>
          )}
        </div>

        {product.target_price && (
          <div className="flex items-center gap-2 text-sm">
            {product.price <= product.target_price ? (
              <div className="flex items-center gap-2 text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span>Objectif atteint ! Le prix actuel est sous votre cible.</span>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <span>Économie potentielle: </span>
                <span className="font-medium text-foreground">
                  {formatPrice(potentialSavings, currency)}
                </span>
                <span> ({((potentialSavings / product.price) * 100).toFixed(0)}%)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info about automatic checks */}
      {!product.link && (
        <p className="text-sm text-muted-foreground text-center">
          Ajoutez un lien au produit pour activer le suivi automatique des prix
        </p>
      )}
    </div>
  );
});
