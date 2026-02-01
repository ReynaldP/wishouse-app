import { memo } from 'react';
import { Sparkles, Trophy, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { AIComparisonResult, ProductAIComparison } from '@/types';
import { useState } from 'react';

interface AIComparisonResultsProps {
  result: AIComparisonResult | null;
  className?: string;
}

/**
 * Display AI comparison results summary (context + all results)
 */
export const AIComparisonResults = memo(function AIComparisonResults({
  result,
  className
}: AIComparisonResultsProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!result) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">Analyse IA</span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-3">
          <div className="grid gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Utilisation prévue :</span>
              <p className="mt-1">{result.intendedUse}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Conditions :</span>
              <p className="mt-1">{result.usageConditions}</p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

interface AIScoreBadgeProps {
  comparison: ProductAIComparison | undefined;
  size?: 'sm' | 'md';
}

/**
 * Badge showing AI adjusted score for a product
 */
export const AIScoreBadge = memo(function AIScoreBadge({
  comparison,
  size = 'md'
}: AIScoreBadgeProps) {
  if (!comparison) return null;

  const score = comparison.adjustedScore;
  const isBestChoice = comparison.isBestChoice;

  const scoreColor = score >= 80
    ? 'bg-success/20 text-success border-success/30'
    : score >= 60
    ? 'bg-warning/20 text-warning border-warning/30'
    : 'bg-destructive/20 text-destructive border-destructive/30';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            {isBestChoice && (
              <Badge
                variant="outline"
                className="bg-primary/20 text-primary border-primary/30 gap-1"
              >
                <Trophy className="h-3 w-3" />
                Meilleur choix
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                scoreColor,
                size === 'sm' ? 'text-xs px-1.5 py-0' : ''
              )}
            >
              <Sparkles className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
              {score}/100
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium mb-1">Note IA ajustée</p>
          <p className="text-sm text-muted-foreground">{comparison.justification}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

interface AIJustificationProps {
  comparison: ProductAIComparison | undefined;
}

/**
 * Display justification for AI score
 */
export const AIJustification = memo(function AIJustification({
  comparison
}: AIJustificationProps) {
  if (!comparison) return null;

  return (
    <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>{comparison.justification}</p>
      </div>
    </div>
  );
});
