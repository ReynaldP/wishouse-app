import { NavLink } from 'react-router-dom';
import { Home, Package, FolderOpen, PiggyBank, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useUIStore } from '@/stores/useUIStore';

const navItems = [
  { to: ROUTES.HOME, icon: Home, label: 'Accueil' },
  { to: ROUTES.PRODUCTS, icon: Package, label: 'Produits' },
  { to: 'add', icon: Plus, label: 'Ajouter', isAction: true },
  { to: ROUTES.CATEGORIES, icon: FolderOpen, label: 'Categories' },
  { to: ROUTES.BUDGET, icon: PiggyBank, label: 'Budget' },
];

export function MobileNav() {
  const { setProductFormOpen } = useUIStore();

  const handleAddClick = () => {
    setProductFormOpen(true);
  };

  return (
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
                <div className="flex items-center justify-center w-12 h-12 -mt-6 bg-primary rounded-full shadow-lg active:scale-95 transition-transform">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
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
  );
}
