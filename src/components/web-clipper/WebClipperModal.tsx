import { memo, useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Link,
  Loader2,
  Globe,
  Image as ImageIcon,
  AlertCircle,
  Clipboard,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { fetchAndParseProduct, isValidUrl, extractUrlFromText } from '@/utils/webClipper';
import type { ClippedProduct } from '@/types';

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
  const { openProductFormWithWebData, setProductFormOpen } = useUIStore();

  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clippedData, setClippedData] = useState<ClippedProduct | null>(null);
  const [step, setStep] = useState<'url' | 'preview'>('url');

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep('url');
      setUrlInput(initialUrl || '');
      setClippedData(null);
      setError(null);

      // Auto-fetch if initial URL provided
      if (initialUrl && isValidUrl(initialUrl)) {
        handleFetchUrl(initialUrl);
      }
    }
  }, [open, initialUrl]);

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
      setStep('preview');
    } else {
      setError(result.error || 'Erreur lors de la récupération des données');
    }
  };

  // Open full product form with clipped data
  const handleContinueToForm = () => {
    if (clippedData) {
      openProductFormWithWebData({
        name: clippedData.name,
        price: clippedData.price || 0,
        link: clippedData.link,
        description: clippedData.description,
        image_url: clippedData.image_url,
        source: clippedData.source,
      });
    }
  };

  // Go directly to manual entry (empty form)
  const handleManualEntry = () => {
    onOpenChange(false);
    setProductFormOpen(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Importer depuis le web
          </SheetTitle>
        </SheetHeader>

        {step === 'url' && (
          <div className="space-y-4 pb-4">
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
                onClick={handleManualEntry}
                className="text-muted-foreground"
              >
                Ou saisir manuellement
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && clippedData && (
          <div className="space-y-4 pb-4">
            {/* Source badge */}
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

            {/* Image preview */}
            {clippedData.image_url ? (
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={clippedData.image_url}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {/* Product info preview */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nom du produit</p>
                <p className="font-medium line-clamp-2">{clippedData.name || 'Non détecté'}</p>
              </div>

              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prix</p>
                  <p className="text-xl font-bold text-primary">
                    {clippedData.price ? `${clippedData.price.toFixed(2)} €` : 'Non détecté'}
                  </p>
                </div>
              </div>

              {clippedData.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{clippedData.description}</p>
                </div>
              )}
            </div>

            {/* Info message */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Vous allez pouvoir compléter les informations (catégorie, priorité, tags, etc.) dans le formulaire complet.
              </p>
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
                type="button"
                className="flex-1"
                onClick={handleContinueToForm}
              >
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});
