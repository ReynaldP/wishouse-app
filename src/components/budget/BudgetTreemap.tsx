import { memo, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { formatPrice } from '@/utils/format';
import { generateTreemapData } from '@/utils/chartData';
import type { Category, Product } from '@/types';

interface BudgetTreemapProps {
  categories: Category[];
  products: Product[];
  currency?: string;
}

// Custom content component for Treemap cells
const CustomizedContent = (props: any) => {
  const { x, y, width, height, name, color } = props;
  const showLabel = width > 60 && height > 40;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
        rx={4}
        style={{ cursor: 'pointer' }}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {name && name.length > 12 ? `${name.slice(0, 10)}...` : name}
        </text>
      )}
    </g>
  );
};

export const BudgetTreemap = memo(function BudgetTreemap({
  categories,
  products,
  currency = 'EUR'
}: BudgetTreemapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const data = useMemo(() => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        const categoryProducts = products.filter(p => p.category_id === selectedCategory);
        const subcategoryGroups = new Map<string | null, { name: string; total: number }>();

        categoryProducts.forEach(p => {
          const key = p.subcategory_id;
          const name = p.subcategory?.name ?? 'Sans sous-catégorie';
          if (!subcategoryGroups.has(key)) {
            subcategoryGroups.set(key, { name, total: 0 });
          }
          subcategoryGroups.get(key)!.total += p.price;
        });

        return Array.from(subcategoryGroups.values())
          .filter(item => item.total > 0)
          .map(item => ({
            name: item.name,
            value: item.total,
            color: category.color
          }))
          .sort((a, b) => b.value - a.value);
      }
    }
    return generateTreemapData(categories, products);
  }, [categories, products, selectedCategory]);

  const selectedCategoryName = selectedCategory
    ? categories.find(c => c.id === selectedCategory)?.name
    : null;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Répartition des dépenses</CardTitle>
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
      <CardHeader className="flex flex-row items-center gap-2">
        {selectedCategory && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedCategory(null)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <CardTitle className="text-lg">
          {selectedCategoryName
            ? `Sous-catégories : ${selectedCategoryName}`
            : 'Répartition par catégorie'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <Treemap
            data={data}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<CustomizedContent />}
            onClick={(node: any) => {
              if (!selectedCategory && node?.categoryId) {
                setSelectedCategory(node.categoryId);
              }
            }}
          >
            <Tooltip
              content={({ payload }) => {
                if (!payload || !payload.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-primary font-bold">
                      {formatPrice(item.value, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {((item.value / total) * 100).toFixed(1)}% du total
                    </p>
                  </div>
                );
              }}
            />
          </Treemap>
        </ResponsiveContainer>

        {/* Total */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          Total : <span className="font-bold text-foreground">{formatPrice(total, currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
});
