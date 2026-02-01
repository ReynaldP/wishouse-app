import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, X, Globe, Bell, Target } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useSubcategories } from '@/hooks/useSubcategories';
import { useTags } from '@/hooks/useTags';
import { useCreateProduct, useUpdateProduct, useProduct } from '@/hooks/useProducts';
import { useUIStore } from '@/stores/useUIStore';
import { productSchema, type ProductFormData } from '@/utils/validation';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ImageUpload } from './ImageUpload';

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
  target_price: null,
  price_alert_enabled: false,
};

export function ProductForm({ open, onOpenChange, editingProductId }: ProductFormProps) {
  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const { data: product, isLoading: loadingProduct } = useProduct(editingProductId || null);
  const { prefillProductData, setPrefillProductData, lastUsedCategoryId } = useUIStore();

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
          target_price: product.target_price,
          price_alert_enabled: product.price_alert_enabled,
        });
      } else if (prefillProductData) {
        // Pre-fill with web clipper data
        reset({
          ...defaultValues,
          name: prefillProductData.name,
          price: prefillProductData.price,
          link: prefillProductData.link,
          description: prefillProductData.description,
          image_url: prefillProductData.image_url,
          category_id: lastUsedCategoryId,
        });
      } else {
        reset(defaultValues);
      }
    }
  }, [open, editingProductId, product, prefillProductData, lastUsedCategoryId, reset]);

  // Clear prefill data when modal closes
  useEffect(() => {
    if (!open && prefillProductData) {
      setPrefillProductData(null);
    }
  }, [open, prefillProductData, setPrefillProductData]);

  useEffect(() => {
    if (!selectedCategoryId) {
      setValue('subcategory_id', null);
    }
  }, [selectedCategoryId, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const productData = {
        ...data,
        target_price: data.target_price ?? null,
        price_alert_enabled: data.price_alert_enabled ?? false,
      };

      if (editingProductId) {
        await updateProduct.mutateAsync({
          id: editingProductId,
          updates: productData,
        });
      } else {
        await createProduct.mutateAsync(productData);
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] flex flex-col p-0">
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        <SheetHeader className="px-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">
              {editingProductId ? 'Modifier le produit' : 'Nouveau produit'}
            </SheetTitle>
            {prefillProductData?.source && !editingProductId && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Globe className="h-3 w-3" />
                {prefillProductData.source}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nom du produit *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Canape 3 places"
                  className="h-12 text-base"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Price and Category Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">Prix *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="h-12 text-base"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_price" className="text-sm font-medium flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    Prix cible
                  </Label>
                  <Input
                    id="target_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Alerte si..."
                    className="h-12 text-base"
                    {...register('target_price', {
                      valueAsNumber: true,
                      setValueAs: (v) => v === '' || v === null || isNaN(Number(v)) ? null : Number(v)
                    })}
                  />
                </div>
              </div>

              {/* Price Alert Toggle */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="price_alert" className="text-sm font-medium cursor-pointer">
                      Alerte de prix
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Notification quand le prix atteint la cible
                    </p>
                  </div>
                </div>
                <Controller
                  control={control}
                  name="price_alert_enabled"
                  render={({ field }) => (
                    <Switch
                      id="price_alert"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categorie</Label>
                <Controller
                  control={control}
                  name="category_id"
                  render={({ field }) => (
                    <Select
                      value={field.value || '__none__'}
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Choisir..." />
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

              {/* Subcategory - only if category selected */}
              {selectedCategoryId && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sous-categorie</Label>
                  <Controller
                    control={control}
                    name="subcategory_id"
                    render={({ field }) => (
                      <Select
                        value={field.value || '__none__'}
                        onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Choisir..." />
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
              )}

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Statut</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-12 text-base">
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
                  <Label className="text-sm font-medium">Priorite</Label>
                  <Controller
                    control={control}
                    name="priority"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-12 text-base">
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
              {tags && tags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer transition-colors py-1.5 px-3 text-sm',
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
                  </div>
                </div>
              )}

              {/* Link */}
              <div className="space-y-2">
                <Label htmlFor="link" className="text-sm font-medium">Lien (URL)</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://..."
                  className="h-12 text-base"
                  {...register('link')}
                />
              </div>

              {/* Image Upload/URL */}
              <Controller
                control={control}
                name="image_url"
                render={({ field }) => (
                  <ImageUpload
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />

              {/* Planned Date */}
              <div className="space-y-2">
                <Label htmlFor="planned_date" className="text-sm font-medium">Date prevue</Label>
                <Input
                  id="planned_date"
                  type="date"
                  className="h-12 text-base"
                  {...register('planned_date')}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Notes, caracteristiques..."
                  rows={3}
                  className="text-base resize-none"
                  {...register('description')}
                />
              </div>

              {/* Pros and Cons */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="pros" className="text-sm font-medium">Points positifs</Label>
                  <Textarea
                    id="pros"
                    placeholder="Avantages..."
                    rows={2}
                    className="text-base resize-none"
                    {...register('pros')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cons" className="text-sm font-medium">Points negatifs</Label>
                  <Textarea
                    id="cons"
                    placeholder="Inconvenients..."
                    rows={2}
                    className="text-base resize-none"
                    {...register('cons')}
                  />
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="border-t bg-background p-4 safe-area-inset-bottom">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-12 text-base"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProductId ? 'Enregistrer' : 'Creer'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
