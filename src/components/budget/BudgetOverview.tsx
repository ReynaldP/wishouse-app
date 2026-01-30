import { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatPrice } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { BudgetStats } from '@/types';

interface BudgetOverviewProps {
  stats: BudgetStats;
}

export const BudgetOverview = memo(function BudgetOverview({
  stats,
}: BudgetOverviewProps) {
  const isOverBudget = stats.remaining < 0;
  const isWarning = stats.percentUsed >= 80 && stats.percentUsed < 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vue d'ensemble du budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-muted-foreground">Budget utilisé</p>
              <p className="text-3xl font-bold">
                {formatPrice(stats.purchasedTotal + stats.toBuyTotal, stats.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">sur</p>
              <p className="text-xl font-semibold">
                {formatPrice(stats.totalBudget, stats.currency)}
              </p>
            </div>
          </div>

          <Progress
            value={stats.percentUsed}
            className="h-4"
            indicatorClassName={cn(
              isOverBudget && 'bg-destructive',
              isWarning && 'bg-warning'
            )}
          />

          <div className="flex justify-between text-sm">
            <span
              className={cn(
                'font-medium',
                isOverBudget && 'text-destructive',
                isWarning && 'text-warning'
              )}
            >
              {stats.percentUsed.toFixed(0)}% utilisé
            </span>
            <span
              className={cn(
                'font-medium',
                isOverBudget ? 'text-destructive' : 'text-success'
              )}
            >
              {isOverBudget ? 'Dépassement: ' : 'Restant: '}
              {formatPrice(Math.abs(stats.remaining), stats.currency)}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {formatPrice(stats.purchasedTotal, stats.currency)}
            </p>
            <p className="text-xs text-muted-foreground">Acheté</p>
            <p className="text-xs text-muted-foreground">
              ({stats.byStatus.purchased.count} produits)
            </p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-warning">
              {formatPrice(stats.toBuyTotal, stats.currency)}
            </p>
            <p className="text-xs text-muted-foreground">À acheter</p>
            <p className="text-xs text-muted-foreground">
              ({stats.byStatus.to_buy.count} produits)
            </p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">
              {formatPrice(stats.pendingTotal, stats.currency)}
            </p>
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-xs text-muted-foreground">
              ({stats.byStatus.pending.count} produits)
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between pt-4 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Total produits: </span>
            <span className="font-medium">{stats.productCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Prix moyen: </span>
            <span className="font-medium">
              {formatPrice(stats.averagePrice, stats.currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
