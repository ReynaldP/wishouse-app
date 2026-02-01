import { memo, useMemo, useState, useCallback, useRef } from 'react';
import { X, Download, Share2, History, ChevronDown, FileText, Printer, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { CompareTable } from './CompareTable';
import { ComparisonHistory } from './ComparisonHistory';
import { AIComparisonModal } from './AIComparisonModal';
import { AIComparisonResults } from './AIComparisonResults';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { useUIStore } from '@/stores/useUIStore';
import { calculateProductScore } from '@/utils/comparison';
import { formatPrice } from '@/utils/format';
import type { AIComparisonResult } from '@/types';

export const CompareView = memo(function CompareView() {
  const {
    comparisonViewOpen,
    setComparisonViewOpen,
    comparisonProductIds,
    clearComparison,
    addToComparisonHistory,
    comparisonHistory,
  } = useUIStore();

  const { data: allProducts = [] } = useProducts();
  const { data: settings } = useSettings();
  const [showHistory, setShowHistory] = useState(false);
  const [aiComparisonModalOpen, setAiComparisonModalOpen] = useState(false);
  const [aiComparisonResult, setAiComparisonResult] = useState<AIComparisonResult | null>(null);
  const compareTableRef = useRef<HTMLDivElement>(null);

  const selectedProducts = useMemo(() => {
    return comparisonProductIds
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  }, [allProducts, comparisonProductIds]);

  const currency = settings?.currency ?? 'EUR';

  // Calculate winner
  const winnerId = useMemo(() => {
    if (selectedProducts.length < 2) return undefined;
    const scores = selectedProducts.map(p => ({ id: p.id, score: calculateProductScore(p) }));
    const maxScore = Math.max(...scores.map(s => s.score));
    return scores.find(s => s.score === maxScore)?.id;
  }, [selectedProducts]);

  const handleClose = () => {
    setComparisonViewOpen(false);
  };

  const handleClearAndClose = () => {
    // Save to history before clearing
    if (selectedProducts.length >= 2) {
      addToComparisonHistory(comparisonProductIds, winnerId);
    }
    clearComparison();
  };

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = ['Produit', 'Prix', 'Statut', 'Priorité', 'Catégorie', 'Avantages', 'Inconvénients', 'Score'];
    const rows = selectedProducts.map(p => [
      p.name,
      p.price.toString(),
      p.status,
      p.priority,
      p.category?.name || '-',
      p.pros || '-',
      p.cons || '-',
      calculateProductScore(p).toString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comparaison-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [selectedProducts]);

  // Export to text for sharing
  const handleShare = useCallback(async () => {
    const winner = selectedProducts.find(p => p.id === winnerId);
    const text = `🏠 Comparaison WisHouse\n\n` +
      selectedProducts.map(p => {
        const score = calculateProductScore(p);
        const isWinner = p.id === winnerId;
        return `${isWinner ? '🏆 ' : ''}${p.name}\n` +
          `   Prix: ${formatPrice(p.price, currency)}\n` +
          `   Score: ${score}/100`;
      }).join('\n\n') +
      (winner ? `\n\n✅ Recommandation: ${winner.name}` : '');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comparaison de produits',
          text: text,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        alert('Comparaison copiée dans le presse-papiers!');
      } catch {
        alert('Impossible de partager');
      }
    }
  }, [selectedProducts, winnerId, currency]);

  // Print comparison
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle AI comparison complete
  const handleAIComparisonComplete = useCallback((result: AIComparisonResult) => {
    setAiComparisonResult(result);
  }, []);

  if (selectedProducts.length < 2 && !showHistory) {
    return null;
  }

  return (
    <Sheet open={comparisonViewOpen} onOpenChange={setComparisonViewOpen}>
      <SheetContent side="bottom" className="h-[90vh] overflow-hidden flex flex-col rounded-t-3xl print:h-auto print:overflow-visible">
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-2 print:hidden" />

        <SheetHeader className="flex-shrink-0 pb-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg sm:text-xl">
                {showHistory ? 'Historique' : `Comparaison (${selectedProducts.length})`}
              </SheetTitle>
              {!showHistory && comparisonHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                  className="gap-1 text-xs print:hidden"
                >
                  <History className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Historique</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                    {comparisonHistory.length}
                  </Badge>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1 print:hidden">
              {!showHistory && selectedProducts.length >= 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 h-8 px-2 sm:px-3 bg-primary/10 border-primary/30 hover:bg-primary/20"
                    onClick={() => setAiComparisonModalOpen(true)}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden sm:inline">Comparer avec l'IA</span>
                    <span className="sm:hidden">IA</span>
                  </Button>
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 h-8 px-2 sm:px-3">
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Exporter</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <FileText className="h-4 w-4 mr-2" />
                      Exporter en CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={showHistory ? () => setShowHistory(false) : handleClearAndClose}
                className="h-8"
              >
                {showHistory ? 'Retour' : 'Terminer'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4" ref={compareTableRef}>
          {showHistory ? (
            <ComparisonHistory
              onSelectComparison={(productIds) => {
                // Load comparison from history
                clearComparison();
                productIds.forEach(id => {
                  const exists = allProducts.find(p => p.id === id);
                  if (exists) {
                    useUIStore.getState().addToComparison(id);
                  }
                });
                setShowHistory(false);
              }}
            />
          ) : (
            <>
              {aiComparisonResult && (
                <AIComparisonResults result={aiComparisonResult} className="mb-4" />
              )}
              <CompareTable
                products={selectedProducts}
                currency={currency}
                aiComparisonResult={aiComparisonResult}
              />
            </>
          )}
        </div>

        {/* AI Comparison Modal */}
        <AIComparisonModal
          open={aiComparisonModalOpen}
          onOpenChange={setAiComparisonModalOpen}
          products={selectedProducts}
          onComparisonComplete={handleAIComparisonComplete}
        />
      </SheetContent>
    </Sheet>
  );
});
