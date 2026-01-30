import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useSubcategories } from '@/hooks/useSubcategories';
import { useTags } from '@/hooks/useTags';
import { useFilterStore } from '@/stores/useFilterStore';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ProductFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductFilters({ open, onOpenChange }: ProductFiltersProps) {
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const {
    filters,
    setCategory,
    setSubcategory,
    setStatus,
    setPriority,
    setTag,
    setFavorites,
    resetFilters,
    hasActiveFilters,
  } = useFilterStore();

  const { data: subcategories } = useSubcategories(filters.category_id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filtres
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Réinitialiser
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select
              value={filters.category_id || '__all__'}
              onValueChange={(value) => setCategory(value === '__all__' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Toutes les catégories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          {filters.category_id && subcategories && subcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Sous-catégorie</Label>
              <Select
                value={filters.subcategory_id || '__all__'}
                onValueChange={(value) => setSubcategory(value === '__all__' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les sous-catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes les sous-catégories</SelectItem>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={filters.status || '__all__'}
              onValueChange={(value) => setStatus(value === '__all__' ? undefined : value as typeof filters.status)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous les statuts</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select
              value={filters.priority || '__all__'}
              onValueChange={(value) => setPriority(value === '__all__' ? undefined : value as typeof filters.priority)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Toutes les priorités</SelectItem>
                {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags?.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={filters.tag_id === tag.id ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors',
                    filters.tag_id === tag.id ? '' : 'hover:bg-muted'
                  )}
                  style={
                    filters.tag_id === tag.id
                      ? { backgroundColor: tag.color }
                      : { borderColor: tag.color, color: tag.color }
                  }
                  onClick={() => setTag(filters.tag_id === tag.id ? undefined : tag.id)}
                >
                  {tag.name}
                  {filters.tag_id === tag.id && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Favorites only */}
          <div className="space-y-2">
            <Label>Favoris</Label>
            <div className="flex gap-2">
              <Button
                variant={filters.is_favorite === undefined ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFavorites(undefined)}
              >
                Tous
              </Button>
              <Button
                variant={filters.is_favorite === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFavorites(true)}
              >
                Favoris uniquement
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Appliquer les filtres
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
