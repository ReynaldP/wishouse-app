import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, FolderOpen, PiggyBank, Plus, Globe, FileText } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useUIStore } from '@/stores/useUIStore';
import { WebClipperModal } from '@/components/web-clipper/WebClipperModal';

const navItems = [
  { to: ROUTES.HOME, icon: Home, label: 'Accueil' },
  { to: ROUTES.PRODUCTS, icon: Package, label: 'Produits' },
  { to: 'add', icon: Plus, label: 'Ajouter', isAction: true },
  { to: ROUTES.CATEGORIES, icon: FolderOpen, label: 'Categories' },
  { to: ROUTES.BUDGET, icon: PiggyBank, label: 'Budget' },
];

export function MobileNav() {
  const { setProductFormOpen, webClipperOpen, openWebClipper } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAddClick = () => {
    setMenuOpen(!menuOpen);
  };

  const handleManualAdd = () => {
    setMenuOpen(false);
    setProductFormOpen(true);
  };

  const handleWebClipper = () => {
    setMenuOpen(false);
    openWebClipper();
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t md:hidden safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <button
                  key={item.to}
                  onClick={handleAddClick}
                  className="flex flex-col items-center justify-center flex-1 h-full px-1"
                >
                  <motion.div
                    className="flex items-center justify-center w-12 h-12 -mt-6 bg-primary rounded-full shadow-lg"
                    animate={{ rotate: menuOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus className="h-6 w-6 text-primary-foreground" />
                  </motion.div>
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground active:text-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-5 w-5 transition-all',
                        isActive && 'scale-110'
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={cn(
                      'text-[10px] mt-1 font-medium',
                      isActive && 'font-semibold'
                    )}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Add menu popup */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 md:hidden"
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu options */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 md:hidden"
            >
              <div className="bg-background rounded-2xl shadow-xl border p-2 flex flex-col gap-1 min-w-[200px]">
                <button
                  onClick={handleWebClipper}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted active:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Depuis le web</p>
                    <p className="text-xs text-muted-foreground">Importer depuis une URL</p>
                  </div>
                </button>

                <button
                  onClick={handleManualAdd}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted active:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <FileText className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Saisie manuelle</p>
                    <p className="text-xs text-muted-foreground">Ajouter un produit</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Web Clipper Modal */}
      <WebClipperModal
        open={webClipperOpen}
        onOpenChange={(open) => {
          if (!open) {
            useUIStore.setState({ webClipperOpen: false, webClipperUrl: null });
          }
        }}
      />
    </>
  );
}
