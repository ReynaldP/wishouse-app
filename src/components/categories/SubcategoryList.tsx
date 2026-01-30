import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import {
  useSubcategories,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
} from '@/hooks/useSubcategories';
import { formatPrice } from '@/utils/format';
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

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
    };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-muted-foreground">
          Sous-catégories
        </h4>
        {!isAdding && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Input
            placeholder="Nom de la sous-catégorie"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setIsAdding(false);
            }}
            autoFocus
            className="h-8"
          />
          <Button size="icon" className="h-8 w-8" onClick={handleAdd}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setIsAdding(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* List */}
      {subcategories.length === 0 && !isAdding ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune sous-catégorie
        </p>
      ) : (
        <div className="space-y-2">
          {subcategories.map((sub) => {
            const stats = getSubcategoryStats(sub.id);
            const isEditing = editingId === sub.id;

            return (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(sub.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="h-8"
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleUpdate(sub.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sub.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {stats.count}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(stats.total, currency)}
                      </span>
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
            );
          })}
        </div>
      )}
    </div>
  );
});
