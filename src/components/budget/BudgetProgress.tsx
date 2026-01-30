import { memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { formatPrice } from '@/utils/format';
import { cn } from '@/lib/utils';

interface BudgetProgressProps {
  spent: number;
  budget: number;
  currency?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BudgetProgress = memo(function BudgetProgress({
  spent,
  budget,
  currency = 'EUR',
  showLabels = true,
  size = 'md',
}: BudgetProgressProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = spent > budget;
  const isWarning = percentage >= 80 && percentage < 100;

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className="space-y-1">
      <Progress
        value={percentage}
        className={heightClass}
        indicatorClassName={cn(
          isOverBudget && 'bg-destructive',
          isWarning && !isOverBudget && 'bg-warning'
        )}
      />

      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span
            className={cn(
              isOverBudget && 'text-destructive font-medium',
              isWarning && !isOverBudget && 'text-warning font-medium'
            )}
          >
            {formatPrice(spent, currency)}
          </span>
          <span>{formatPrice(budget, currency)}</span>
        </div>
      )}
    </div>
  );
});
