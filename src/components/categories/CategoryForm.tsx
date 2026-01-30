import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useCreateCategory, useUpdateCategory, useCategory } from '@/hooks/useCategories';
import { categorySchema, type CategoryFormData } from '@/utils/validation';
import { DEFAULT_CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategoryId?: string | null;
}

const defaultValues: CategoryFormData = {
  name: '',
  icon: '🏠',
  color: DEFAULT_CATEGORY_COLORS[0],
  budget: 0,
  order_index: 0,
};

// Emoji picker simple
const emojiIcons = [
  '🏠', '🛋️', '🛏️', '🍳', '🚿', '💡', '📺', '💻',
  '🧺', '❄️', '🌱', '🎨', '🔧', '🚗', '👶', '🎮',
  '🎵', '📚', '💪', '👕', '🧹', '🪴', '🍽️', '☕',
];

export function CategoryForm({ open, onOpenChange, editingCategoryId }: CategoryFormProps) {
  const { data: category, isLoading: loadingCategory } = useCategory(editingCategoryId || null);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  useEffect(() => {
    if (open) {
      if (editingCategoryId && category) {
        reset({
          name: category.name,
          icon: category.icon,
          color: category.color,
          budget: category.budget,
          order_index: category.order_index,
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, editingCategoryId, category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategoryId) {
        await updateCategory.mutateAsync({
          id: editingCategoryId,
          updates: data,
        });
      } else {
        await createCategory.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isLoading = editingCategoryId && loadingCategory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCategoryId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                placeholder="Ex: Salon"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>Icône</Label>
              <div className="grid grid-cols-8 gap-2">
                {emojiIcons.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={cn(
                      'w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all',
                      selectedIcon === emoji
                        ? 'bg-primary text-primary-foreground scale-110'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                    onClick={() => setValue('icon', emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      selectedColor === color && 'ring-2 ring-offset-2 ring-primary scale-110'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setValue('color', color)}
                  />
                ))}
              </div>
              <Input
                type="color"
                className="w-full h-10"
                value={selectedColor}
                onChange={(e) => setValue('color', e.target.value)}
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Budget alloué</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('budget', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Laissez à 0 pour ne pas définir de budget
              </p>
              {errors.budget && (
                <p className="text-sm text-destructive">{errors.budget.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCategoryId ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
