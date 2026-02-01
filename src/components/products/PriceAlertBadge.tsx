import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Bell, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface PriceAlertBadgeProps {
  product: Product;
  className?: string;
  showDetails?: boolean;
}

export const PriceAlertBadge = memo(function PriceAlertBadge({
  product,
  className,
  showDetails = false
}: PriceAlertBadgeProps) {
  // Check if target price is reached
  const isTargetReached = product.target_price && product.price <= product.target_price;

  // Check if alert is enabled
  const hasAlert = product.price_alert_enabled && product.target_price;

  if (!hasAlert && !isTargetReached) {
    return null;
  }

  if (isTargetReached) {
    return (
      <Badge
        variant="default"
        className={cn(
          'bg-green-500 hover:bg-green-600 text-white gap-1',
          className
        )}
      >
        <TrendingDown className="h-3 w-3" />
        {showDetails ? (
          <span>Prix cible atteint !</span>
        ) : (
          <span>Cible</span>
        )}
      </Badge>
    );
  }

  if (hasAlert) {
    const percentToTarget = product.target_price
      ? ((product.price - product.target_price) / product.price) * 100
      : 0;

    return (
      <Badge
        variant="outline"
        className={cn(
          'border-amber-500 text-amber-600 dark:text-amber-400 gap-1',
          className
        )}
      >
        <Bell className="h-3 w-3" />
        {showDetails ? (
          <span>-{percentToTarget.toFixed(0)}% pour cible</span>
        ) : (
          <Target className="h-3 w-3" />
        )}
      </Badge>
    );
  }

  return null;
});

/**
 * Smaller inline indicator for compact views
 */
export const PriceAlertIndicator = memo(function PriceAlertIndicator({
  product,
  className
}: {
  product: Product;
  className?: string;
}) {
  const isTargetReached = product.target_price && product.price <= product.target_price;

  if (!isTargetReached) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white',
        className
      )}
      title="Prix cible atteint !"
    >
      <TrendingDown className="h-3 w-3" />
    </div>
  );
});
