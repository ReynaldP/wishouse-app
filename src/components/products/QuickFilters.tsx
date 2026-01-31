import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Heart, Clock, ShoppingCart, Check } from 'lucide-react';
import { useFilterStore } from '@/stores/useFilterStore';
import { useUIStore } from '@/stores/useUIStore';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { Status } from '@/types';

const statusButtons: { status: Status; icon: React.ElementType; label: string }[] = [
  { status: 'pending', icon: Clock, label: 'En attente' },
  { status: 'to_buy', icon: ShoppingCart, label: 'À acheter' },
  { status: 'purchased', icon: Check, label: 'Achetés' },
];

export const QuickFilters = memo(function QuickFilters() {
  const { data: categories } = useCategories();
  const { filters, setStatus, setCategory, setFavorites, resetFilters, hasActiveFilters } = useFilterStore();
  const { setFiltersOpen } = useUIStore();

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Quick status filters - compact on mobile */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
        <Button
          variant={!filters.status ? 'default' : 'outline'}
          size="sm"
          className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
          onClick={() => setStatus(undefined)}
        >
          Tous
        </Button>
        {statusButtons.map(({ status, icon: Icon, label }) => (
          <Button
            key={status}
            variant={filters.status === status ? 'default' : 'outline'}
            size="sm"
            className="gap-1 flex-shrink-0 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
            onClick={() => setStatus(filters.status === status ? undefined : status)}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        ))}
        <Button
          variant={filters.is_favorite ? 'default' : 'outline'}
          size="sm"
          className="gap-1 flex-shrink-0 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
          onClick={() => setFavorites(filters.is_favorite ? undefined : true)}
        >
          <Heart className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', filters.is_favorite && 'fill-current')} />
          <span className="hidden sm:inline">Favoris</span>
        </Button>
      </div>

      {/* Category pills - compact on mobile */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
        <Badge
          variant={!filters.category_id ? 'default' : 'outline'}
          className="cursor-pointer flex-shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
          onClick={() => setCategory(undefined)}
        >
          Toutes
        </Badge>
        {categories?.map((cat) => (
          <Badge
            key={cat.id}
            variant={filters.category_id === cat.id ? 'default' : 'outline'}
            className="cursor-pointer flex-shrink-0 gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
            style={
              filters.category_id === cat.id
                ? { backgroundColor: cat.color }
                : { borderColor: cat.color }
            }
            onClick={() => setCategory(filters.category_id === cat.id ? undefined : cat.id)}
          >
            <span
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
              style={{ backgroundColor: filters.category_id === cat.id ? 'white' : cat.color }}
            />
            {cat.name}
          </Badge>
        ))}
      </div>

      {/* Advanced filters button and active filters - compact */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
          onClick={() => setFiltersOpen(true)}
        >
          <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Filtres avances</span>
          <span className="sm:hidden">Filtres</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 text-[10px] px-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground h-7 sm:h-8 px-2 text-xs sm:text-sm"
            onClick={resetFilters}
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Reinitialiser</span>
          </Button>
        )}
      </div>
    </div>
  );
});
