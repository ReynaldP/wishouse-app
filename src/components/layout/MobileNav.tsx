import { NavLink } from 'react-router-dom';
import { Home, Package, FolderOpen, PiggyBank, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

const navItems = [
  { to: ROUTES.HOME, icon: Home, label: 'Accueil' },
  { to: ROUTES.PRODUCTS, icon: Package, label: 'Produits' },
  { to: ROUTES.CATEGORIES, icon: FolderOpen, label: 'Catégories' },
  { to: ROUTES.BUDGET, icon: PiggyBank, label: 'Budget' },
  { to: ROUTES.SETTINGS, icon: Settings, label: 'Paramètres' },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t safe-area-inset-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 py-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform',
                    isActive && 'scale-110'
                  )}
                />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
