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
    <div className="space-y-3">
      {/* Quick status filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Button
          variant={!filters.status ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatus(undefined)}
        >
          Tous
        </Button>
        {statusButtons.map(({ status, icon: Icon, label }) => (
          <Button
            key={status}
            variant={filters.status === status ? 'default' : 'outline'}
            size="sm"
            className="gap-1 flex-shrink-0"
            onClick={() => setStatus(filters.status === status ? undefined : status)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
        <Button
          variant={filters.is_favorite ? 'default' : 'outline'}
          size="sm"
          className="gap-1 flex-shrink-0"
          onClick={() => setFavorites(filters.is_favorite ? undefined : true)}
        >
          <Heart className={cn('h-4 w-4', filters.is_favorite && 'fill-current')} />
          Favoris
        </Button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Badge
          variant={!filters.category_id ? 'default' : 'outline'}
          className="cursor-pointer flex-shrink-0"
          onClick={() => setCategory(undefined)}
        >
          Toutes catégories
        </Badge>
        {categories?.map((cat) => (
          <Badge
            key={cat.id}
            variant={filters.category_id === cat.id ? 'default' : 'outline'}
            className="cursor-pointer flex-shrink-0 gap-1"
            style={
              filters.category_id === cat.id
                ? { backgroundColor: cat.color }
                : { borderColor: cat.color }
            }
            onClick={() => setCategory(filters.category_id === cat.id ? undefined : cat.id)}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: filters.category_id === cat.id ? 'white' : cat.color }}
            />
            {cat.name}
          </Badge>
        ))}
      </div>

      {/* Advanced filters button and active filters */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setFiltersOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Filtres avancés
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={resetFilters}
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
});
