import { memo, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Globe, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickAddForm } from './QuickAddForm';
import { WebClipperModal } from '@/components/web-clipper';
import { useUIStore } from '@/stores/useUIStore';

export const QuickAddFAB = memo(function QuickAddFAB() {
  const { quickAddOpen, setQuickAddOpen, webClipperOpen, setWebClipperOpen } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen(!menuOpen);
  }, [menuOpen]);

  const handleQuickAdd = useCallback(() => {
    setMenuOpen(false);
    setQuickAddOpen(true);
  }, [setQuickAddOpen]);

  const handleWebClipper = useCallback(() => {
    setMenuOpen(false);
    setWebClipperOpen(true);
  }, [setWebClipperOpen]);

  // Keyboard shortcuts
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

      // Check for "N" key (without modifiers) - toggle menu
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (!quickAddOpen && !webClipperOpen) {
          setMenuOpen(true);
        }
      }

      // Escape to close
      if (e.key === 'Escape') {
        if (menuOpen) setMenuOpen(false);
        if (quickAddOpen) setQuickAddOpen(false);
        if (webClipperOpen) setWebClipperOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickAddOpen, webClipperOpen, menuOpen, setQuickAddOpen, setWebClipperOpen]);

  return (
    <>
      {/* Speed dial menu options */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-30"
              onClick={() => setMenuOpen(false)}
            />

            {/* Web Clipper option */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.05 }}
              className="fixed bottom-36 right-4 z-40 md:bottom-24 flex items-center gap-2"
            >
              <span className="bg-background/90 backdrop-blur-sm text-foreground text-sm px-3 py-1.5 rounded-lg shadow-lg">
                Importer du web
              </span>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleWebClipper}
                className="h-12 w-12 rounded-full shadow-lg"
              >
                <Globe className="h-5 w-5" />
              </Button>
            </motion.div>

            {/* Manual add option */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="fixed bottom-52 right-4 z-40 md:bottom-40 flex items-center gap-2"
            >
              <span className="bg-background/90 backdrop-blur-sm text-foreground text-sm px-3 py-1.5 rounded-lg shadow-lg">
                Saisie manuelle
              </span>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleQuickAdd}
                className="h-12 w-12 rounded-full shadow-lg"
              >
                <FileText className="h-5 w-5" />
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <AnimatePresence mode="wait">
        <motion.div
          key={menuOpen ? 'close' : 'open'}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-20 right-4 z-40 md:bottom-6"
        >
          <Button
            size="lg"
            onClick={toggleMenu}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label={menuOpen ? 'Fermer' : 'Ajouter'}
          >
            {menuOpen ? (
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
          {!menuOpen && !quickAddOpen && !webClipperOpen && (
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

      {/* Web Clipper Modal */}
      <WebClipperModal open={webClipperOpen} onOpenChange={setWebClipperOpen} />
    </>
  );
});
