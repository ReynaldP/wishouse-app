import { useLocation } from 'react-router-dom';
import { Menu, Plus, Search, SlidersHorizontal } from 'lucide-react';
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
  [ROUTES.CATEGORIES]: 'Categories',
  [ROUTES.BUDGET]: 'Budget',
  [ROUTES.SETTINGS]: 'Parametres',
};

export function Header() {
  const location = useLocation();
  const { toggleSidebar, setProductFormOpen, setFiltersOpen } = useUIStore();
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
              'text-lg md:text-xl font-bold transition-opacity',
              showSearch && 'hidden md:block'
            )}
          >
            {title}
          </h1>
        </div>

        {/* Mobile search bar - inline */}
        {showSearch && isProductsPage && (
          <div className="flex-1 mx-2 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 h-10"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

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
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile search toggle */}
          {isProductsPage && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className={cn("h-5 w-5", showSearch && "text-primary")} />
            </Button>
          )}

          {/* Mobile filters button */}
          {isProductsPage && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          )}

          {/* Add product button - desktop only */}
          {isProductsPage && (
            <Button
              size="sm"
              className="hidden md:flex gap-1"
              onClick={() => setProductFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
