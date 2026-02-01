import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';
import { ProductForm } from '@/components/products/ProductForm';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const {
    productFormOpen,
    setProductFormOpen,
    editingProductId,
    setEditingProductId,
  } = useUIStore();

  const handleCloseForm = () => {
    setProductFormOpen(false);
    setEditingProductId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        <div className="md:hidden">
          <Sidebar />
        </div>

        {/* Main content */}
        <main
          className={cn(
            'flex-1 min-h-screen transition-all duration-300',
            'pb-20 md:pb-0' // Space for mobile nav
          )}
        >
          <Header />

          <div className="container px-4 py-4 md:py-6 overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Global Product Form - accessible from mobile nav */}
      <ProductForm
        open={productFormOpen}
        onOpenChange={handleCloseForm}
        editingProductId={editingProductId}
      />
    </div>
  );
}
