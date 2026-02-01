import { memo, useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { formatPrice, formatDateShort } from '@/utils/format';
import type { PriceHistory } from '@/types';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface PriceHistoryChartProps {
  history: PriceHistory[];
  currentPrice: number;
  targetPrice?: number | null;
  currency?: string;
  height?: number;
}

interface ChartDataPoint {
  date: string;
  label: string;
  price: number;
  source: string;
}

export const PriceHistoryChart = memo(function PriceHistoryChart({
  history,
  currentPrice,
  targetPrice,
  currency = 'EUR',
  height = 200
}: PriceHistoryChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (history.length === 0) {
      // Show at least the current price
      return [{
        date: new Date().toISOString(),
        label: 'Aujourd\'hui',
        price: currentPrice,
        source: 'current'
      }];
    }

    return history.map(h => ({
      date: h.recorded_at,
      label: formatDateShort(h.recorded_at),
      price: h.price,
      source: h.source
    }));
  }, [history, currentPrice]);

  const stats = useMemo(() => {
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = last - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;

    return { min, max, first, last, change, changePercent };
  }, [chartData]);

  const getTrendInfo = () => {
    if (Math.abs(stats.changePercent) < 1) {
      return { icon: Minus, color: 'text-gray-500', label: 'Stable' };
    }
    if (stats.changePercent < 0) {
      return { icon: TrendingDown, color: 'text-green-500', label: 'En baisse' };
    }
    return { icon: TrendingUp, color: 'text-red-500', label: 'En hausse' };
  };

  const trend = getTrendInfo();
  const TrendIcon = trend.icon;

  // Calculate domain for Y axis with some padding
  const yMin = Math.min(stats.min, targetPrice || stats.min) * 0.95;
  const yMax = stats.max * 1.05;

  if (chartData.length <= 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
        <p className="text-sm">Pas encore d'historique de prix</p>
        <p className="text-xs mt-1">
          Le suivi démarrera lors de la prochaine vérification
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <TrendIcon className={`h-4 w-4 ${trend.color}`} />
          <span className={trend.color}>
            {stats.changePercent > 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">
            ({stats.change > 0 ? '+' : ''}{formatPrice(stats.change, currency)})
          </span>
        </div>
        <div className="flex gap-4 text-muted-foreground">
          <span>Min: {formatPrice(stats.min, currency)}</span>
          <span>Max: {formatPrice(stats.max, currency)}</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickMargin={8}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(value) => formatPrice(value, currency)}
            tick={{ fontSize: 11 }}
            width={70}
          />

          <Tooltip
            formatter={(value: number) => [formatPrice(value, currency), 'Prix']}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />

          {/* Target price reference line */}
          {targetPrice && (
            <ReferenceLine
              y={targetPrice}
              stroke="#22c55e"
              strokeDasharray="5 5"
              label={{
                value: `Cible: ${formatPrice(targetPrice, currency)}`,
                position: 'right',
                fill: '#22c55e',
                fontSize: 11
              }}
            />
          )}

          {/* Price area */}
          <Area
            type="monotone"
            dataKey="price"
            stroke="#6366f1"
            fill="url(#priceGradient)"
            strokeWidth={2}
          />

          {/* Price line with dots */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6, fill: '#4f46e5' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
