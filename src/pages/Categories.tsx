import { useState } from 'react';
import { useCategories, useDeleteCategory } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { SubcategoryList } from '@/components/categories/SubcategoryList';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Plus, FolderOpen } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import type { Category } from '@/types';

export function Categories() {
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: products = [] } = useProducts();
  const { data: settings } = useSettings();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const currency = settings?.currency || 'EUR';

  if (loadingCategories) {
    return <LoadingSpinner fullScreen />;
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleClick = (category: Category) => {
    setSelectedCategory(category);
    setDetailOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const getCategoryProducts = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catégories</h1>
          <p className="text-muted-foreground">
            {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {/* Categories grid */}
      {categories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Aucune catégorie"
          description="Créez des catégories pour organiser vos produits et gérer votre budget par pièce ou type."
          actionLabel="Créer une catégorie"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              products={getCategoryProducts(category.id)}
              currency={currency}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClick={handleClick}
            />
          ))}
        </div>
      )}

      {/* Category form */}
      <CategoryForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        editingCategoryId={editingId}
      />

      {/* Category detail sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          {selectedCategory && (
            <>
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${selectedCategory.color}20` }}
                  >
                    {selectedCategory.icon}
                  </div>
                  <div>
                    <SheetTitle>{selectedCategory.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryProducts(selectedCategory.id).length} produits
                    </p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Budget info */}
                {selectedCategory.budget > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Budget alloué</p>
                    <p className="text-2xl font-bold">
                      {formatPrice(selectedCategory.budget, currency)}
                    </p>
                  </div>
                )}

                {/* Subcategories */}
                <SubcategoryList
                  categoryId={selectedCategory.id}
                  products={products}
                  currency={currency}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer la catégorie"
        description={`Êtes-vous sûr de vouloir supprimer "${categoryToDelete?.name}" ? Les produits associés seront conservés mais n'auront plus de catégorie.`}
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteCategory.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
