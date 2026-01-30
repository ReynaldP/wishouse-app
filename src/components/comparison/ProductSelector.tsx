import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductSelectorProps {
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

export const ProductSelector = memo(function ProductSelector({
  isSelected,
  isDisabled,
  onToggle
}: ProductSelectorProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDisabled) onToggle();
      }}
      disabled={isDisabled}
      className={cn(
        'absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
        isSelected
          ? 'bg-primary border-primary text-primary-foreground'
          : 'bg-background/80 border-muted-foreground/50 hover:border-primary',
        isDisabled && !isSelected && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={isSelected ? 'Désélectionner' : 'Sélectionner pour comparaison'}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Check className="h-4 w-4" />
        </motion.div>
      )}
    </motion.button>
  );
});
