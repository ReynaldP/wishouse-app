import { memo, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Clock, ShoppingCart, CheckCircle, Package } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { generateStatusData } from '@/utils/chartData';
import { cn } from '@/lib/utils';
import type { Product, Status } from '@/types';

interface StatusDistributionProps {
  products: Product[];
  currency?: string;
  onStatusClick?: (status: Status) => void;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'to_buy':
      return <ShoppingCart className="h-4 w-4" />;
    case 'purchased':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

export const StatusDistribution = memo(function StatusDistribution({
  products,
  currency = 'EUR',
  onStatusClick
}: StatusDistributionProps) {
  const data = useMemo(() => generateStatusData(products), [products]);

  const total = data.reduce((sum, item) => sum + item.total, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribution par statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Aucun produit
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribution par statut</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Pie Chart */}
          <div className="w-full md:w-1/2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="total"
                  onClick={(entry) => {
                    if (onStatusClick && entry.status) {
                      onStatusClick(entry.status as Status);
                    }
                  }}
                  style={{ cursor: onStatusClick ? 'pointer' : 'default' }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-primary font-bold">
                          {formatPrice(item.total, currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.count} produit{item.count > 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with details */}
          <div className="w-full md:w-1/2 space-y-3">
            {data.map((item) => {
              const percentage = total > 0 ? (item.total / total) * 100 : 0;

              return (
                <button
                  key={item.status}
                  onClick={() => onStatusClick?.(item.status as Status)}
                  disabled={!onStatusClick}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                    'bg-muted/50 hover:bg-muted',
                    !onStatusClick && 'cursor-default'
                  )}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    <StatusIcon status={item.status} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.count} produit{item.count > 1 ? 's' : ''}
                      </span>
                      <span className="font-bold" style={{ color: item.color }}>
                        {formatPrice(item.total, currency)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Total */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatPrice(total, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{totalCount} produit{totalCount > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
