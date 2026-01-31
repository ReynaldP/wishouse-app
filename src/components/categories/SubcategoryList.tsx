import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Check, X, ChevronDown, ChevronUp, Scale, Package } from 'lucide-react';
import {
  useSubcategories,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
} from '@/hooks/useSubcategories';
import { useUIStore } from '@/stores/useUIStore';
import { formatPrice } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Subcategory, Product } from '@/types';

interface SubcategoryListProps {
  categoryId: string;
  products: Product[];
  currency?: string;
}

export const SubcategoryList = memo(function SubcategoryList({
  categoryId,
  products,
  currency = 'EUR',
}: SubcategoryListProps) {
  const { data: subcategories = [] } = useSubcategories(categoryId);
  const createSubcategory = useCreateSubcategory();
  const updateSubcategory = useUpdateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();
  const { addToComparison, removeFromComparison, comparisonProductIds, setComparisonViewOpen, setComparisonMode } = useUIStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());

  const handleAdd = async () => {
    if (!newName.trim()) return;

    await createSubcategory.mutateAsync({
      name: newName.trim(),
      category_id: categoryId,
      budget: 0,
      order_index: subcategories.length,
    });

    setNewName('');
    setIsAdding(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;

    await updateSubcategory.mutateAsync({
      id,
      updates: { name: editingName.trim() },
    });

    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette sous-catégorie ?')) {
      await deleteSubcategory.mutateAsync(id);
    }
  };

  const startEditing = (subcategory: Subcategory) => {
    setEditingId(subcategory.id);
    setEditingName(subcategory.name);
  };

  const getSubcategoryStats = (subcategoryId: string) => {
    const subProducts = products.filter(
      (p) => p.subcategory_id === subcategoryId
    );
    return {
      count: subProducts.length,
      total: subProducts.reduce((sum, p) => sum + p.price, 0),
      products: subProducts,
    };
  };

  const toggleExpand = (subcategoryId: string) => {
    if (expandedSubcategory === subcategoryId) {
      setExpandedSubcategory(null);
      setSelectedForCompare(new Set());
    } else {
      setExpandedSubcategory(subcategoryId);
      setSelectedForCompare(new Set());
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedForCompare);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else if (newSelected.size < 4) {
      newSelected.add(productId);
    }
    setSelectedForCompare(newSelected);
  };

  const handleCompareSelected = () => {
    // Clear previous comparison
    comparisonProductIds.forEach(id => removeFromComparison(id));

    // Add selected products
    selectedForCompare.forEach(id => addToComparison(id));

    // Open comparison view
    setComparisonMode(true);
    setComparisonViewOpen(true);
  };

  const handleCompareAll = (subcategoryProducts: Product[]) => {
    // Clear previous comparison
    comparisonProductIds.forEach(id => removeFromComparison(id));

    // Add first 4 products
    subcategoryProducts.slice(0, 4).forEach(p => addToComparison(p.id));

    // Open comparison view
    setComparisonMode(true);
    setComparisonViewOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground">
          Sous-catégories ({subcategories.length})
        </h4>
        {!isAdding && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 h-8"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Input
            placeholder="Nom..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setIsAdding(false);
            }}
            autoFocus
            className="h-10 text-base"
          />
          <Button size="icon" className="h-10 w-10 flex-shrink-0" onClick={handleAdd}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => setIsAdding(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* List - scrollable on mobile */}
      {subcategories.length === 0 && !isAdding ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune sous-catégorie
        </p>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {subcategories.map((sub) => {
            const stats = getSubcategoryStats(sub.id);
            const isEditing = editingId === sub.id;
            const isExpanded = expandedSubcategory === sub.id;
            const canCompare = stats.count >= 2;

            return (
              <div key={sub.id} className="rounded-lg border overflow-hidden">
                {/* Subcategory Header */}
                <div
                  className={cn(
                    "flex items-center justify-between p-2.5 sm:p-3 gap-2 cursor-pointer transition-colors",
                    isExpanded ? "bg-muted" : "bg-muted/50 hover:bg-muted/70"
                  )}
                  onClick={() => !isEditing && toggleExpand(sub.id)}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(sub.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="h-10 text-base"
                      />
                      <Button
                        size="icon"
                        className="h-10 w-10 flex-shrink-0"
                        onClick={() => handleUpdate(sub.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 flex-shrink-0"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm truncate">{sub.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 flex-shrink-0">
                          {stats.count}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap mr-1">
                          {formatPrice(stats.total, currency)}
                        </span>
                        {canCompare && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => handleCompareAll(stats.products)}
                          >
                            <Scale className="h-3 w-3" />
                            <span className="hidden sm:inline">Comparer</span>
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEditing(sub)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(sub.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Expanded Products List */}
                {isExpanded && stats.count > 0 && (
                  <div className="border-t bg-background">
                    {/* Selection toolbar */}
                    {selectedForCompare.size >= 2 && (
                      <div className="p-2 bg-primary/5 border-b flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {selectedForCompare.size} selectionne(s)
                        </span>
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={handleCompareSelected}
                        >
                          <Scale className="h-3 w-3" />
                          Comparer
                        </Button>
                      </div>
                    )}

                    {/* Products */}
                    <div className="divide-y">
                      {stats.products.map((product) => (
                        <div
                          key={product.id}
                          className={cn(
                            "flex items-center gap-2 p-2.5 hover:bg-muted/30 transition-colors",
                            selectedForCompare.has(product.id) && "bg-primary/5"
                          )}
                        >
                          {/* Checkbox for comparison */}
                          <Checkbox
                            checked={selectedForCompare.has(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                            disabled={!selectedForCompare.has(product.id) && selectedForCompare.size >= 4}
                            className="flex-shrink-0"
                          />

                          {/* Product image */}
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}

                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-semibold text-primary">
                                {formatPrice(product.price, currency)}
                              </span>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] px-1",
                                  product.status === 'purchased' && "bg-success/20 text-success",
                                  product.status === 'to_buy' && "bg-warning/20 text-warning",
                                  product.status === 'pending' && "bg-muted"
                                )}
                              >
                                {product.status === 'purchased' ? 'Achete' :
                                 product.status === 'to_buy' ? 'A acheter' : 'En attente'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Help text */}
                    {stats.count >= 2 && selectedForCompare.size < 2 && (
                      <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                        Selectionnez 2 a 4 produits pour les comparer
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state for expanded subcategory */}
                {isExpanded && stats.count === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground bg-background border-t">
                    Aucun produit dans cette sous-categorie
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
