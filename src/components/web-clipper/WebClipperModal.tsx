import { memo, useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Link,
  Loader2,
  Globe,
  Image as ImageIcon,
  AlertCircle,
  Check,
  Clipboard,
  ExternalLink,
} from 'lucide-react';
import { StatusButtons } from '@/components/quick-add/StatusButtons';
import { CategoryIconPicker } from '@/components/quick-add/CategoryIconPicker';
import { useCategories } from '@/hooks/useCategories';
import { useCreateProduct } from '@/hooks/useProducts';
import { useUIStore } from '@/stores/useUIStore';
import { fetchAndParseProduct, isValidUrl, extractUrlFromText } from '@/utils/webClipper';
import type { Status, ClippedProduct } from '@/types';

const clipperSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  price: z.number().min(0, 'Le prix doit être positif'),
  category_id: z.string().nullable(),
  status: z.enum(['pending', 'to_buy', 'purchased']),
  link: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

type ClipperFormData = z.infer<typeof clipperSchema>;

interface WebClipperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
}

export const WebClipperModal = memo(function WebClipperModal({
  open,
  onOpenChange,
  initialUrl,
}: WebClipperModalProps) {
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const { lastUsedCategoryId, setLastUsedCategoryId } = useUIStore();

  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clippedData, setClippedData] = useState<ClippedProduct | null>(null);
  const [step, setStep] = useState<'url' | 'form'>('url');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClipperFormData>({
    resolver: zodResolver(clipperSchema),
    defaultValues: {
      name: '',
      price: 0,
      category_id: lastUsedCategoryId,
      status: 'pending',
      link: '',
      description: '',
      image_url: '',
    },
  });

  const selectedCategoryId = watch('category_id');
  const selectedStatus = watch('status');
  const imageUrl = watch('image_url');

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep('url');
      setUrlInput(initialUrl || '');
      setClippedData(null);
      setError(null);
      reset({
        name: '',
        price: 0,
        category_id: lastUsedCategoryId,
        status: 'pending',
        link: '',
        description: '',
        image_url: '',
      });

      // Auto-fetch if initial URL provided
      if (initialUrl && isValidUrl(initialUrl)) {
        handleFetchUrl(initialUrl);
      }
    }
  }, [open, initialUrl, lastUsedCategoryId, reset]);

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const url = extractUrlFromText(text);
      if (url) {
        setUrlInput(url);
      } else {
        setUrlInput(text);
      }
    } catch {
      setError('Impossible de lire le presse-papiers');
    }
  }, []);

  // Fetch and parse URL
  const handleFetchUrl = async (url?: string) => {
    const targetUrl = url || urlInput;

    if (!targetUrl || !isValidUrl(targetUrl)) {
      setError('Veuillez entrer une URL valide');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await fetchAndParseProduct(targetUrl);

    setIsLoading(false);

    if (result.success && result.data) {
      setClippedData(result.data);

      // Pre-fill form
      setValue('name', result.data.name);
      setValue('price', result.data.price || 0);
      setValue('link', result.data.link);
      setValue('description', result.data.description);
      setValue('image_url', result.data.image_url);

      setStep('form');
    } else {
      setError(result.error || 'Erreur lors de la récupération des données');
    }
  };

  // Submit form
  const onSubmit = async (data: ClipperFormData) => {
    try {
      await createProduct.mutateAsync({
        name: data.name,
        price: data.price,
        category_id: data.category_id,
        subcategory_id: null,
        status: data.status,
        priority: 'medium',
        link: data.link || '',
        description: data.description || '',
        image_url: data.image_url || '',
        planned_date: null,
        is_favorite: false,
        pros: '',
        cons: '',
      });

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
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-3xl">
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Importer depuis le web
          </SheetTitle>
        </SheetHeader>

        {step === 'url' && (
          <div className="space-y-4">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url">URL du produit</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  placeholder="https://www.example.com/produit"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePaste}
                  title="Coller"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Supported sites */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Sites supportés :</p>
              <div className="flex flex-wrap gap-1">
                {['Amazon', 'IKEA', 'Leroy Merlin', 'Cdiscount', 'Fnac', 'Boulanger', 'Conforama', 'But'].map((site) => (
                  <Badge key={site} variant="secondary" className="text-[10px]">
                    {site}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-[10px]">
                  + tous les sites avec métadonnées
                </Badge>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse de la page...
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}

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
                type="button"
                className="flex-1"
                onClick={() => handleFetchUrl()}
                disabled={isLoading || !urlInput}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link className="mr-2 h-4 w-4" />
                )}
                Analyser
              </Button>
            </div>

            {/* Manual entry option */}
            <div className="text-center pt-4 border-t">
              <Button
                variant="link"
                onClick={() => setStep('form')}
                className="text-muted-foreground"
              >
                Ou saisir manuellement
              </Button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Source badge */}
            {clippedData?.source && (
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-1">
                  <Globe className="h-3 w-3" />
                  {clippedData.source}
                </Badge>
                {clippedData.link && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(clippedData.link, '_blank')}
                    className="gap-1 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Voir l'original
                  </Button>
                )}
              </div>
            )}

            {/* Image preview */}
            {imageUrl && (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {!imageUrl && (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="clip-name">Nom du produit</Label>
              <Input
                id="clip-name"
                placeholder="Ex: Canapé 3 places"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="clip-price">Prix (€)</Label>
              <Input
                id="clip-price"
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="clip-description">Description (optionnel)</Label>
              <Textarea
                id="clip-description"
                placeholder="Description du produit..."
                rows={2}
                {...register('description')}
              />
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
                onClick={() => setStep('url')}
              >
                Retour
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || createProduct.isPending}
              >
                {(isSubmitting || createProduct.isPending) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Ajouter
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
});
