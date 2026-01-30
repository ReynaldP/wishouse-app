import { NavLink } from 'react-router-dom';
import {
  Home,
  Package,
  FolderOpen,
  PiggyBank,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';
import { useAuth } from '@/hooks/useAuth';
import { useBudgetOverview } from '@/hooks/useBudget';
import { formatPrice } from '@/utils/format';
import { ROUTES } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';

const navItems = [
  { to: ROUTES.HOME, icon: Home, label: 'Tableau de bord' },
  { to: ROUTES.PRODUCTS, icon: Package, label: 'Produits' },
  { to: ROUTES.CATEGORIES, icon: FolderOpen, label: 'Catégories' },
  { to: ROUTES.BUDGET, icon: PiggyBank, label: 'Budget' },
  { to: ROUTES.SETTINGS, icon: Settings, label: 'Paramètres' },
];

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { signOut, user } = useAuth();
  const { stats, isOverBudget, isWarning } = useBudgetOverview();

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-background border-r transform transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:static md:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-14 px-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Wishouse</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Budget summary */}
          {stats && (
            <div className="p-4 border-b">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget utilisé</span>
                  <span
                    className={cn(
                      'font-medium',
                      isOverBudget && 'text-destructive',
                      isWarning && 'text-warning'
                    )}
                  >
                    {stats.percentUsed.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={stats.percentUsed}
                  className="h-2"
                  indicatorClassName={cn(
                    isOverBudget && 'bg-destructive',
                    isWarning && 'bg-warning'
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {formatPrice(stats.purchasedTotal + stats.toBuyTotal)}
                  </span>
                  <span>{formatPrice(stats.totalBudget)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground">Connecté</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
