import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ChevronRight } from 'lucide-react';
import { BudgetProgress } from '@/components/budget/BudgetProgress';
import { formatPrice } from '@/utils/format';
import type { Category, Product } from '@/types';

interface CategoryCardProps {
  category: Category;
  products: Product[];
  currency?: string;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onClick: (category: Category) => void;
}

export const CategoryCard = memo(function CategoryCard({
  category,
  products,
  currency = 'EUR',
  onEdit,
  onDelete,
  onClick,
}: CategoryCardProps) {
  const categoryProducts = products.filter(
    (p) => p.category_id === category.id
  );
  const spent = categoryProducts
    .filter((p) => p.status !== 'pending')
    .reduce((sum, p) => sum + p.price, 0);
  const totalValue = categoryProducts.reduce((sum, p) => sum + p.price, 0);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(category);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(category);
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98]"
      onClick={() => onClick(category)}
    >
      <CardContent className="p-2.5 sm:p-4 overflow-hidden">
        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
          {/* Color indicator - smaller on mobile */}
          <div
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-2xl flex-shrink-0"
            style={{ backgroundColor: `${category.color}20` }}
          >
            {category.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 mb-1">
              <h3 className="font-semibold truncate text-sm sm:text-base flex-1 min-w-0">{category.name}</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>

            {/* Stats row - more compact on mobile */}
            <div className="flex items-center gap-1 sm:gap-2 mb-2">
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 flex-shrink-0">
                {categoryProducts.length}
              </Badge>
              <span className="text-[11px] sm:text-sm font-medium truncate">
                {formatPrice(totalValue, currency)}
              </span>
            </div>

            {/* Budget progress */}
            {category.budget > 0 && (
              <BudgetProgress
                spent={spent}
                budget={category.budget}
                currency={currency}
                size="sm"
              />
            )}
          </div>

          {/* Actions - inline on mobile for space saving */}
          <div className="flex flex-col gap-0 sm:hidden flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleEdit}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Actions - bottom row on desktop only */}
        <div className="hidden sm:flex justify-end gap-1 mt-3 pt-3 border-t">
          <Button size="sm" variant="ghost" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
