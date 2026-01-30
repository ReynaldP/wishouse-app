import { memo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickAddForm } from './QuickAddForm';
import { useUIStore } from '@/stores/useUIStore';

export const QuickAddFAB = memo(function QuickAddFAB() {
  const { quickAddOpen, setQuickAddOpen } = useUIStore();

  const toggleQuickAdd = useCallback(() => {
    setQuickAddOpen(!quickAddOpen);
  }, [quickAddOpen, setQuickAddOpen]);

  // Keyboard shortcut: N to open quick add (desktop only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for "N" key (without modifiers)
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setQuickAddOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape' && quickAddOpen) {
        setQuickAddOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickAddOpen, setQuickAddOpen]);

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence mode="wait">
        <motion.div
          key={quickAddOpen ? 'close' : 'open'}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-20 right-4 z-40 md:bottom-6"
        >
          <Button
            size="lg"
            onClick={toggleQuickAdd}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label={quickAddOpen ? 'Fermer' : 'Ajout rapide'}
          >
            {quickAddOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </motion.div>
      </AnimatePresence>

      {/* Keyboard shortcut hint (desktop only) */}
      <div className="hidden md:block fixed bottom-6 right-20 z-30">
        <AnimatePresence>
          {!quickAddOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="bg-muted/80 backdrop-blur-sm text-muted-foreground text-xs px-2 py-1 rounded"
            >
              Appuyez sur <kbd className="font-mono bg-background px-1 rounded">N</kbd>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add Form Sheet */}
      <QuickAddForm open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </>
  );
});
