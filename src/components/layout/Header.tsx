import { useLocation } from 'react-router-dom';
import { Menu, Plus, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/stores/useUIStore';
import { useFilterStore } from '@/stores/useFilterStore';
import { ROUTES } from '@/lib/constants';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  [ROUTES.HOME]: 'Tableau de bord',
  [ROUTES.PRODUCTS]: 'Produits',
  [ROUTES.CATEGORIES]: 'Catégories',
  [ROUTES.BUDGET]: 'Budget',
  [ROUTES.SETTINGS]: 'Paramètres',
};

export function Header() {
  const location = useLocation();
  const { toggleSidebar, setProductFormOpen } = useUIStore();
  const { setSearch } = useFilterStore();
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const title = pageTitles[location.pathname] || 'Wishouse';
  const isProductsPage = location.pathname === ROUTES.PRODUCTS;

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setSearch(value || undefined);
  };

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex items-center justify-between h-14 px-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1
            className={cn(
              'text-xl font-bold transition-opacity',
              showSearch && 'opacity-0 md:opacity-100'
            )}
          >
            {title}
          </h1>
        </div>

        {/* Center - Search (desktop) */}
        {isProductsPage && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                className="pl-9"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Mobile search toggle */}
          {isProductsPage && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </Button>

          {/* Add product button */}
          {isProductsPage && (
            <Button
              size="sm"
              className="gap-1"
              onClick={() => setProductFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && isProductsPage && (
        <div className="md:hidden px-4 pb-3 animate-in slide-in-from-top">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              className="pl-9"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
