import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAIComparison } from '@/hooks/useAIComparison';
import type { Product, AIComparisonResult } from '@/types';

interface AIComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onComparisonComplete: (result: AIComparisonResult) => void;
}

export function AIComparisonModal({
  open,
  onOpenChange,
  products,
  onComparisonComplete
}: AIComparisonModalProps) {
  const [intendedUse, setIntendedUse] = useState('');
  const [usageConditions, setUsageConditions] = useState('');

  const createComparison = useCreateAIComparison();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!intendedUse.trim() || !usageConditions.trim()) {
      return;
    }

    const result = await createComparison.mutateAsync({
      products,
      intendedUse: intendedUse.trim(),
      usageConditions: usageConditions.trim()
    });

    onComparisonComplete(result);
    onOpenChange(false);
    setIntendedUse('');
    setUsageConditions('');
  };

  const handleClose = () => {
    if (!createComparison.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Comparer avec l'IA
          </DialogTitle>
          <DialogDescription>
            Décrivez votre utilisation prévue pour obtenir une analyse personnalisée des {products.length} produits sélectionnés.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="intended-use">
              Utilisation prévue <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="intended-use"
              placeholder="Ex: Je cherche un aspirateur pour un appartement de 60m² avec un chat. J'ai besoin de nettoyer principalement du parquet et un tapis."
              value={intendedUse}
              onChange={(e) => setIntendedUse(e.target.value)}
              rows={3}
              disabled={createComparison.isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Décrivez ce que vous souhaitez faire avec le produit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage-conditions">
              Conditions d'utilisation <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="usage-conditions"
              placeholder="Ex: Utilisation quotidienne, stockage dans un petit placard, je préfère un modèle silencieux car je travaille à domicile."
              value={usageConditions}
              onChange={(e) => setUsageConditions(e.target.value)}
              rows={3}
              disabled={createComparison.isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Précisez vos contraintes et préférences
            </p>
          </div>

          {/* Products summary */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Produits à comparer :</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {products.map((product) => (
                <li key={product.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {product.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createComparison.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createComparison.isPending || !intendedUse.trim() || !usageConditions.trim()}
              className="gap-2"
            >
              {createComparison.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyser
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
