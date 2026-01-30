import { memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusButtons } from './StatusButtons';
import { CategoryIconPicker } from './CategoryIconPicker';
import { useCategories } from '@/hooks/useCategories';
import { useCreateProduct } from '@/hooks/useProducts';
import { useUIStore } from '@/stores/useUIStore';
import type { Status } from '@/types';

const quickAddSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  price: z.number().min(0, 'Le prix doit être positif'),
  category_id: z.string().nullable(),
  status: z.enum(['pending', 'to_buy', 'purchased'])
});

type QuickAddFormData = z.infer<typeof quickAddSchema>;

interface QuickAddFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickAddForm = memo(function QuickAddForm({ open, onOpenChange }: QuickAddFormProps) {
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const { lastUsedCategoryId, setLastUsedCategoryId } = useUIStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<QuickAddFormData>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      name: '',
      price: 0,
      category_id: lastUsedCategoryId,
      status: 'pending'
    }
  });

  const selectedCategoryId = watch('category_id');
  const selectedStatus = watch('status');

  // Reset form when opened
  useEffect(() => {
    if (open) {
      reset({
        name: '',
        price: 0,
        category_id: lastUsedCategoryId,
        status: 'pending'
      });
    }
  }, [open, lastUsedCategoryId, reset]);

  const onSubmit = async (data: QuickAddFormData) => {
    try {
      await createProduct.mutateAsync({
        name: data.name,
        price: data.price,
        category_id: data.category_id,
        subcategory_id: null,
        status: data.status,
        priority: 'medium',
        link: '',
        description: '',
        image_url: '',
        planned_date: null,
        is_favorite: false,
        pros: '',
        cons: ''
      });

      // Remember the category for next time
      if (data.category_id) {
        setLastUsedCategoryId(data.category_id);
      }

      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-3xl">
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

        <SheetHeader className="mb-4">
          <SheetTitle>Ajout rapide</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="quick-name">Nom du produit</Label>
            <Input
              id="quick-name"
              placeholder="Ex: Canapé 3 places"
              autoFocus
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="quick-price">Prix (€)</Label>
            <Input
              id="quick-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              {...register('price', { valueAsNumber: true })}
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <CategoryIconPicker
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={(id) => setValue('category_id', id)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <StatusButtons
              value={selectedStatus}
              onChange={(status: Status) => setValue('status', status)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || createProduct.isPending}
            >
              {(isSubmitting || createProduct.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Ajouter
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
});
