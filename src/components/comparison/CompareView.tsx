import { memo, useMemo } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CompareTable } from './CompareTable';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { useUIStore } from '@/stores/useUIStore';

export const CompareView = memo(function CompareView() {
  const {
    comparisonViewOpen,
    setComparisonViewOpen,
    comparisonProductIds,
    clearComparison
  } = useUIStore();

  const { data: allProducts = [] } = useProducts();
  const { data: settings } = useSettings();

  const selectedProducts = useMemo(() => {
    return comparisonProductIds
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  }, [allProducts, comparisonProductIds]);

  const currency = settings?.currency ?? 'EUR';

  const handleClose = () => {
    setComparisonViewOpen(false);
  };

  const handleClearAndClose = () => {
    clearComparison();
  };

  if (selectedProducts.length < 2) {
    return null;
  }

  return (
    <Sheet open={comparisonViewOpen} onOpenChange={setComparisonViewOpen}>
      <SheetContent side="bottom" className="h-[90vh] overflow-hidden flex flex-col rounded-t-3xl">
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-2" />

        <SheetHeader className="flex-shrink-0 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">
              Comparaison ({selectedProducts.length} produits)
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAndClose}
              >
                Terminer
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4">
          <CompareTable products={selectedProducts} currency={currency} />
        </div>
      </SheetContent>
    </Sheet>
  );
});
