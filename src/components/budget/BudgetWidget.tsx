import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Check,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { BudgetStats } from '@/types';

interface BudgetWidgetProps {
  stats: BudgetStats;
  onNavigate?: () => void;
  compact?: boolean;
}

export const BudgetWidget = memo(function BudgetWidget({
  stats,
  onNavigate,
  compact = false,
}: BudgetWidgetProps) {
  const isOverBudget = stats.remaining < 0;
  const isWarning = stats.percentUsed >= 80 && stats.percentUsed < 100;
  const isHealthy = stats.percentUsed < 80;

  const getStatusIcon = () => {
    if (isOverBudget) return AlertTriangle;
    if (isWarning) return TrendingUp;
    return TrendingDown;
  };

  const getStatusColor = () => {
    if (isOverBudget) return 'text-destructive';
    if (isWarning) return 'text-warning';
    return 'text-success';
  };

  const StatusIcon = getStatusIcon();

  if (compact) {
    return (
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isOverBudget && 'border-destructive/50',
          isWarning && 'border-warning/50'
        )}
        onClick={onNavigate}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  isOverBudget && 'bg-destructive/10',
                  isWarning && 'bg-warning/10',
                  isHealthy && 'bg-success/10'
                )}
              >
                <Wallet className={cn('h-4 w-4', getStatusColor())} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget restant</p>
                <p className={cn('text-lg font-bold', getStatusColor())}>
                  {formatPrice(Math.abs(stats.remaining), stats.currency)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge
                variant={isOverBudget ? 'destructive' : isWarning ? 'secondary' : 'outline'}
                className="text-[10px]"
              >
                {stats.percentUsed.toFixed(0)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'overflow-hidden',
        isOverBudget && 'border-destructive/50',
        isWarning && 'border-warning/50'
      )}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isOverBudget && 'bg-destructive/10',
                isWarning && 'bg-warning/10',
                isHealthy && 'bg-success/10'
              )}
            >
              <StatusIcon className={cn('h-5 w-5', getStatusColor())} />
            </div>
            <div>
              <p className="text-sm font-medium">Budget Maison</p>
              <p className="text-xs text-muted-foreground">
                {isOverBudget ? 'Dépassé' : isWarning ? 'Attention' : 'Sous contrôle'}
              </p>
            </div>
          </div>
          {onNavigate && (
            <Button variant="ghost" size="icon" onClick={onNavigate}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Main amount */}
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground mb-1">
            {isOverBudget ? 'Dépassement' : 'Restant'}
          </p>
          <p className={cn('text-3xl font-bold', getStatusColor())}>
            {isOverBudget && '-'}
            {formatPrice(Math.abs(stats.remaining), stats.currency)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            sur {formatPrice(stats.totalBudget, stats.currency)}
          </p>
        </div>

        {/* Progress */}
        <Progress
          value={Math.min(stats.percentUsed, 100)}
          className="h-2"
          indicatorClassName={cn(
            isOverBudget && 'bg-destructive',
            isWarning && 'bg-warning',
            isHealthy && 'bg-success'
          )}
        />

        {/* Status breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 bg-success/5 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Check className="h-3 w-3 text-success" />
              <span className="text-[10px] text-muted-foreground">Acheté</span>
            </div>
            <p className="text-sm font-semibold text-success">
              {formatPrice(stats.purchasedTotal, stats.currency)}
            </p>
          </div>
          <div className="text-center p-2 bg-warning/5 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ShoppingCart className="h-3 w-3 text-warning" />
              <span className="text-[10px] text-muted-foreground">À acheter</span>
            </div>
            <p className="text-sm font-semibold text-warning">
              {formatPrice(stats.toBuyTotal, stats.currency)}
            </p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Attente</span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {formatPrice(stats.pendingTotal, stats.currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
