import { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryIconPickerProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export const CategoryIconPicker = memo(function CategoryIconPicker({
  categories,
  selectedId,
  onSelect
}: CategoryIconPickerProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        Aucune catégorie disponible
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
      {categories.map(category => {
        const isSelected = selectedId === category.id;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(isSelected ? null : category.id)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all',
              'hover:scale-105 active:scale-95',
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-transparent bg-muted/50 hover:bg-muted'
            )}
            title={category.name}
          >
            <span
              className="text-2xl"
              role="img"
              aria-label={category.name}
            >
              {category.icon}
            </span>
            <span className="text-xs truncate w-full text-center">
              {category.name}
            </span>
            {isSelected && (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: category.color }}
              >
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
              style={{ backgroundColor: category.color }}
            />
          </button>
        );
      })}
    </div>
  );
});
