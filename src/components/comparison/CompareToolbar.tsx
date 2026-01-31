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
      'flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg transition-all',
      comparisonMode ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
    )}>
      <Button
        variant={comparisonMode ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggleMode}
        className="gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
      >
        {comparisonMode ? (
          <>
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Annuler</span>
          </>
        ) : (
          <>
            <GitCompare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Comparer</span>
          </>
        )}
      </Button>

      {comparisonMode && (
        <>
          <Badge variant="secondary" className="gap-0.5 text-[10px] sm:text-xs px-1.5">
            {selectedCount}/4
          </Badge>

          <div className="flex-1" />

          <Button
            variant="default"
            size="sm"
            onClick={handleCompare}
            disabled={!canCompare}
            className="gap-1.5 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <GitCompare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Comparer</span>
            <span className="sm:hidden">OK</span>
          </Button>
        </>
      )}

      {!comparisonMode && (
        <span className="text-xs sm:text-sm text-muted-foreground">
          <span className="hidden sm:inline">Comparez jusqu'a 4 produits</span>
          <span className="sm:hidden">Max 4 produits</span>
        </span>
      )}
    </div>
  );
});
