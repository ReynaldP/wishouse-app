import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wallet,
  ShoppingBag,
  ShoppingCart,
  PiggyBank,
  Package,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatPrice, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

type IconType = 'wallet' | 'shopping-bag' | 'shopping-cart' | 'piggy-bank' | 'package' | 'trending-up' | 'trending-down';
type FormatType = 'currency' | 'number' | 'percent';
type Variant = 'default' | 'success' | 'warning' | 'destructive';

const icons: Record<IconType, React.ElementType> = {
  wallet: Wallet,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  'piggy-bank': PiggyBank,
  package: Package,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
};

const variants: Record<Variant, { bg: string; text: string }> = {
  default: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive' },
};

interface StatCardProps {
  title: string;
  value: number;
  icon: IconType;
  format?: FormatType;
  variant?: Variant;
  subtitle?: string;
  trend?: number;
  currency?: string;
}

export const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  format = 'number',
  variant = 'default',
  subtitle,
  trend,
  currency = 'EUR',
}: StatCardProps) {
  const Icon = icons[icon];
  const variantStyles = variants[variant];

  const formatValue = () => {
    switch (format) {
      case 'currency':
        return formatPrice(value, currency);
      case 'percent':
        return `${value.toFixed(0)}%`;
      default:
        return formatNumber(value);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue()}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  trend >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-full', variantStyles.bg)}>
            <Icon className={cn('h-5 w-5', variantStyles.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
