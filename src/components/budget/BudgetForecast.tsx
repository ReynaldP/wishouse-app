import { memo, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatPrice } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Product, BudgetStats } from '@/types';

interface BudgetForecastProps {
  products: Product[];
  stats: BudgetStats;
  currency?: string;
  monthsAhead?: number;
}

export const BudgetForecast = memo(function BudgetForecast({
  products,
  stats,
  currency = 'EUR',
  monthsAhead = 3,
}: BudgetForecastProps) {
  // Calculate forecast data
  const forecastData = useMemo(() => {
    const now = new Date();
    const data = [];
    let cumulativeSpent = stats.purchasedTotal;

    for (let i = 0; i <= monthsAhead; i++) {
      const month = addMonths(now, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Find products planned for this month
      const plannedProducts = products.filter(p => {
        if (p.status === 'purchased' || !p.planned_date) return false;
        const plannedDate = parseISO(p.planned_date);
        return isWithinInterval(plannedDate, { start: monthStart, end: monthEnd });
      });

      const monthPlanned = plannedProducts.reduce((sum, p) => sum + p.price, 0);

      // For current month, include to_buy products
      const currentMonthToBuy = i === 0 ? stats.toBuyTotal : 0;

      cumulativeSpent += monthPlanned + (i > 0 ? 0 : 0);

      data.push({
        month: format(month, 'MMM yyyy', { locale: fr }),
        monthKey: format(month, 'yyyy-MM'),
        planned: monthPlanned,
        toBuy: currentMonthToBuy,
        cumulative: cumulativeSpent + (i === 0 ? stats.toBuyTotal : monthPlanned),
        budget: stats.totalBudget,
        products: plannedProducts,
        productCount: plannedProducts.length,
      });
    }

    return data;
  }, [products, stats, monthsAhead]);

  // Calculate totals
  const totalPlanned = forecastData.reduce((sum, d) => sum + d.planned + d.toBuy, 0);
  const projectedTotal = stats.purchasedTotal + totalPlanned;
  const willExceedBudget = projectedTotal > stats.totalBudget;
  const percentOfBudget = (projectedTotal / stats.totalBudget) * 100;

  // Get next purchases
  const nextPurchases = forecastData
    .flatMap(d => d.products)
    .sort((a, b) => {
      if (!a.planned_date || !b.planned_date) return 0;
      return new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime();
    })
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prévisions ({monthsAhead} mois)
          </CardTitle>
          <Badge
            variant={willExceedBudget ? 'destructive' : 'secondary'}
            className="gap-1"
          >
            {willExceedBudget ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {willExceedBudget ? 'Dépassement prévu' : 'Dans le budget'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total projeté</p>
            <p className={cn(
              'text-xl sm:text-2xl font-bold',
              willExceedBudget ? 'text-destructive' : 'text-primary'
            )}>
              {formatPrice(projectedTotal, currency)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">À planifier</p>
            <p className="text-xl sm:text-2xl font-bold text-warning">
              {formatPrice(totalPlanned, currency)}
            </p>
          </div>
        </div>

        {/* Budget progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Projection vs Budget</span>
            <span className={cn(
              'font-medium',
              willExceedBudget ? 'text-destructive' : 'text-success'
            )}>
              {percentOfBudget.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={Math.min(percentOfBudget, 100)}
            className="h-2"
            indicatorClassName={cn(
              percentOfBudget > 100 && 'bg-destructive',
              percentOfBudget >= 80 && percentOfBudget <= 100 && 'bg-warning'
            )}
          />
        </div>

        {/* Chart */}
        <div className="h-[180px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-1">{data.month}</p>
                      <p className="text-sm text-muted-foreground">
                        Prévu: <span className="text-warning font-medium">{formatPrice(data.planned + data.toBuy, currency)}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cumulé: <span className="text-primary font-medium">{formatPrice(data.cumulative, currency)}</span>
                      </p>
                      {data.productCount > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.productCount} produit{data.productCount > 1 ? 's' : ''} planifié{data.productCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={stats.totalBudget}
                stroke="hsl(var(--destructive))"
                strokeDasharray="5 5"
                label={{
                  value: 'Budget',
                  position: 'right',
                  fill: 'hsl(var(--destructive))',
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming purchases */}
        {nextPurchases.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Prochains achats prévus
            </p>
            <div className="space-y-2">
              {nextPurchases.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: product.category?.color || '#9ca3af' }}
                    />
                    <span className="text-sm truncate">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {product.planned_date && format(parseISO(product.planned_date), 'dd MMM', { locale: fr })}
                    </span>
                    <span className="text-sm font-medium">
                      {formatPrice(product.price, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
