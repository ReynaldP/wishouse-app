import { memo, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatPrice } from '@/utils/format';
import { generateStackedBarData } from '@/utils/chartData';
import type { Category, CategoryStats } from '@/types';

interface BudgetStackedBarProps {
  categories: Category[];
  stats: CategoryStats[];
  currency?: string;
  onCategoryClick?: (categoryId: string) => void;
}

export const BudgetStackedBar = memo(function BudgetStackedBar({
  categories,
  stats,
  currency = 'EUR',
  onCategoryClick
}: BudgetStackedBarProps) {
  const data = useMemo(
    () => generateStackedBarData(categories, stats),
    [categories, stats]
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget vs Dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Aucune donnée disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.allocated, d.spent)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Budget vs Dépenses par catégorie</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 60)}>
          <BarChart
            data={data}
            layout="vertical"
            onClick={(e) => {
              if (e && e.activePayload && onCategoryClick) {
                const categoryId = e.activePayload[0]?.payload?.categoryId;
                if (categoryId) onCategoryClick(categoryId);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => formatPrice(value, currency)}
              tick={{ fontSize: 12 }}
              domain={[0, maxValue * 1.1]}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatPrice(value, currency),
                name === 'spent' ? 'Dépensé' : name === 'allocated' ? 'Budget alloué' : 'Restant'
              ]}
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
            />
            <Legend
              formatter={(value) =>
                value === 'spent' ? 'Dépensé' :
                value === 'allocated' ? 'Budget alloué' : 'Restant'
              }
            />

            {/* Budget allocated (background) */}
            <Bar
              dataKey="allocated"
              fill="#e5e7eb"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />

            {/* Actual spent */}
            <Bar
              dataKey="spent"
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.spent > entry.allocated ? '#ef4444' : entry.color}
                  cursor={onCategoryClick ? 'pointer' : 'default'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend for over-budget */}
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#e5e7eb]" />
            <span className="text-muted-foreground">Budget alloué</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">Dépensé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span className="text-muted-foreground">Dépassement</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
