import { memo } from 'react';
import { GitCompare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

export const CompareToolbar = memo(function CompareToolbar() {
  const {
    comparisonMode,
    setComparisonMode,
    comparisonProductIds,
    clearComparison,
    setComparisonViewOpen
  } = useUIStore();

  const selectedCount = comparisonProductIds.length;
  const canCompare = selectedCount >= 2;

  const handleToggleMode = () => {
    if (comparisonMode) {
      clearComparison();
    } else {
      setComparisonMode(true);
    }
  };

  const handleCompare = () => {
    if (canCompare) {
      setComparisonViewOpen(true);
    }
  };

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 rounded-lg transition-all',
      comparisonMode ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
    )}>
      <Button
        variant={comparisonMode ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggleMode}
        className="gap-2"
      >
        {comparisonMode ? (
          <>
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Annuler</span>
          </>
        ) : (
          <>
            <GitCompare className="h-4 w-4" />
            <span className="hidden sm:inline">Comparer</span>
          </>
        )}
      </Button>

      {comparisonMode && (
        <>
          <Badge variant="secondary" className="gap-1">
            {selectedCount} / 4
          </Badge>

          <span className="text-sm text-muted-foreground hidden sm:inline">
            sélectionnés
          </span>

          <div className="flex-1" />

          <Button
            variant="default"
            size="sm"
            onClick={handleCompare}
            disabled={!canCompare}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            Comparer
          </Button>
        </>
      )}

      {!comparisonMode && (
        <span className="text-sm text-muted-foreground">
          Comparez jusqu'à 4 produits
        </span>
      )}
    </div>
  );
});
