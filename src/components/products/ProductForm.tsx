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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useSubcategories } from '@/hooks/useSubcategories';
import { useTags } from '@/hooks/useTags';
import { useCreateProduct, useUpdateProduct, useProduct } from '@/hooks/useProducts';
import { productSchema, type ProductFormData } from '@/utils/validation';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProductId?: string | null;
}

const defaultValues: ProductFormData = {
  name: '',
  price: 0,
  category_id: null,
  subcategory_id: null,
  link: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  image_url: '',
  planned_date: null,
  is_favorite: false,
  pros: '',
  cons: '',
  tag_ids: [],
};

export function ProductForm({ open, onOpenChange, editingProductId }: ProductFormProps) {
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const { data: product, isLoading: loadingProduct } = useProduct(editingProductId || null);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const selectedCategoryId = watch('category_id');
  const selectedTagIds = watch('tag_ids') || [];
  const { data: subcategories } = useSubcategories(selectedCategoryId || undefined);

  // Reset form when opening/closing or when product data loads
  useEffect(() => {
    if (open) {
      if (editingProductId && product) {
        reset({
          name: product.name,
          price: product.price,
          category_id: product.category_id,
          subcategory_id: product.subcategory_id,
          link: product.link || '',
          description: product.description || '',
          status: product.status,
          priority: product.priority,
          image_url: product.image_url || '',
          planned_date: product.planned_date,
          is_favorite: product.is_favorite,
          pros: product.pros || '',
          cons: product.cons || '',
          tag_ids: product.tags?.map(t => t.id) || [],
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, editingProductId, product, reset]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (!selectedCategoryId) {
      setValue('subcategory_id', null);
    }
  }, [selectedCategoryId, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (editingProductId) {
        await updateProduct.mutateAsync({
          id: editingProductId,
          updates: data,
        });
      } else {
        await createProduct.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const toggleTag = (tagId: string) => {
    const current = selectedTagIds || [];
    if (current.includes(tagId)) {
      setValue('tag_ids', current.filter(id => id !== tagId));
    } else {
      setValue('tag_ids', [...current, tagId]);
    }
  };

  const isLoading = editingProductId && loadingProduct;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProductId ? 'Modifier le produit' : 'Nouveau produit'}
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
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                placeholder="Ex: Canapé 3 places"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Prix *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            {/* Category and Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || '__none__'}
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune</SelectItem>
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
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Sous-catégorie</Label>
                <Controller
                  control={control}
                  name="subcategory_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || '__none__'}
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      disabled={!selectedCategoryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune</SelectItem>
                        {subcategories?.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                          <SelectItem key={value} value={value}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selectedTagIds.includes(tag.id)
                        ? ''
                        : 'hover:bg-muted'
                    )}
                    style={
                      selectedTagIds.includes(tag.id)
                        ? { backgroundColor: tag.color }
                        : { borderColor: tag.color, color: tag.color }
                    }
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                    {selectedTagIds.includes(tag.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
                {(!tags || tags.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    Aucun tag disponible
                  </p>
                )}
              </div>
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="link">Lien (URL)</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://..."
                {...register('link')}
              />
              {errors.link && (
                <p className="text-sm text-destructive">{errors.link.message}</p>
              )}
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image_url">Image (URL)</Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://..."
                {...register('image_url')}
              />
              {errors.image_url && (
                <p className="text-sm text-destructive">{errors.image_url.message}</p>
              )}
            </div>

            {/* Planned Date */}
            <div className="space-y-2">
              <Label htmlFor="planned_date">Date prévue</Label>
              <Input
                id="planned_date"
                type="date"
                {...register('planned_date')}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Notes, caractéristiques..."
                rows={3}
                {...register('description')}
              />
            </div>

            {/* Pros and Cons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pros">Points positifs</Label>
                <Textarea
                  id="pros"
                  placeholder="Avantages..."
                  rows={2}
                  {...register('pros')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cons">Points négatifs</Label>
                <Textarea
                  id="cons"
                  placeholder="Inconvénients..."
                  rows={2}
                  {...register('cons')}
                />
              </div>
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
                {editingProductId ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
