import { memo, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { formatPrice } from '@/utils/format';
import { generateTimelineData, STATUS_COLORS } from '@/utils/chartData';
import type { Product } from '@/types';

interface BudgetTimelineProps {
  products: Product[];
  currency?: string;
  monthsBack?: number;
}

export const BudgetTimeline = memo(function BudgetTimeline({
  products,
  currency = 'EUR',
  monthsBack = 6
}: BudgetTimelineProps) {
  const data = useMemo(
    () => generateTimelineData(products, monthsBack),
    [products, monthsBack]
  );

  const hasData = data.some(d => d.purchased > 0 || d.to_buy > 0 || d.pending > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Évolution du budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Aucune donnée disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Évolution du budget</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={(value) => formatPrice(value, currency)}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatPrice(value, currency),
                name === 'cumulative' ? 'Cumulé' :
                name === 'projected' ? 'Projeté' :
                name === 'purchased' ? 'Acheté' :
                name === 'to_buy' ? 'À acheter' : 'En attente'
              ]}
              labelFormatter={(label) => label}
            />
            <Legend
              formatter={(value) =>
                value === 'cumulative' ? 'Dépenses cumulées' :
                value === 'projected' ? 'Projections' :
                value === 'purchased' ? 'Acheté' :
                value === 'to_buy' ? 'À acheter' : 'En attente'
              }
            />

            {/* Stacked area for spending by status */}
            <Area
              type="monotone"
              dataKey="purchased"
              stackId="1"
              fill={STATUS_COLORS.purchased}
              stroke={STATUS_COLORS.purchased}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="to_buy"
              stackId="1"
              fill={STATUS_COLORS.to_buy}
              stroke={STATUS_COLORS.to_buy}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="pending"
              stackId="1"
              fill={STATUS_COLORS.pending}
              stroke={STATUS_COLORS.pending}
              fillOpacity={0.4}
            />

            {/* Cumulative line */}
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />

            {/* Projected spending (dashed) */}
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#6366f1', r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
