import { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatPrice } from '@/utils/format';
import type { CategoryStats, BudgetStats } from '@/types';

interface BudgetChartProps {
  data: CategoryStats[] | BudgetStats['byStatus'];
  type?: 'category' | 'status';
  currency?: string;
}

const statusColors = {
  pending: '#9ca3af',
  to_buy: '#f59e0b',
  purchased: '#22c55e',
};

const statusLabels = {
  pending: 'En attente',
  to_buy: 'À acheter',
  purchased: 'Acheté',
};

export const BudgetChart = memo(function BudgetChart({
  data,
  type = 'category',
  currency = 'EUR',
}: BudgetChartProps) {
  if (type === 'status') {
    const statusData = data as BudgetStats['byStatus'];
    const chartData = Object.entries(statusData).map(([key, value]) => ({
      name: statusLabels[key as keyof typeof statusLabels],
      value: value.total,
      count: value.count,
      color: statusColors[key as keyof typeof statusColors],
    }));

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              Aucune donnée disponible
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition par statut</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatPrice(value, currency)}
              />
              <Legend
                formatter={(value, _entry) => {
                  const item = chartData.find((d) => d.name === value);
                  return `${value} (${item?.count || 0})`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // Category chart
  const categoryData = (data as CategoryStats[]).filter((cat) => cat.total > 0);

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Aucune donnée disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Répartition par catégorie</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={categoryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => formatPrice(value, currency)}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => formatPrice(value, currency)}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
