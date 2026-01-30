import { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BudgetProgress } from './BudgetProgress';
import { formatPrice } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Category, Product } from '@/types';

interface CategoryBudgetProps {
  categories: Category[];
  products: Product[];
  currency?: string;
}

export const CategoryBudget = memo(function CategoryBudget({
  categories,
  products,
  currency = 'EUR',
}: CategoryBudgetProps) {
  const categoryStats = categories.map((category) => {
    const categoryProducts = products.filter(
      (p) => p.category_id === category.id && p.status !== 'pending'
    );
    const spent = categoryProducts.reduce((sum, p) => sum + p.price, 0);
    const isOverBudget = category.budget > 0 && spent > category.budget;

    return {
      ...category,
      spent,
      isOverBudget,
      productCount: categoryProducts.length,
    };
  });

  // Sort by spent amount (descending)
  const sortedStats = [...categoryStats].sort((a, b) => b.spent - a.spent);

  if (sortedStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Aucune catégorie créée
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Budget par catégorie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedStats.map((category) => (
          <div key={category.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({category.productCount} produits)
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  category.isOverBudget && 'text-destructive'
                )}
              >
                {formatPrice(category.spent, currency)}
                {category.budget > 0 && (
                  <span className="text-muted-foreground">
                    {' '}
                    / {formatPrice(category.budget, currency)}
                  </span>
                )}
              </span>
            </div>

            {category.budget > 0 && (
              <BudgetProgress
                spent={category.spent}
                budget={category.budget}
                currency={currency}
                showLabels={false}
                size="sm"
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
