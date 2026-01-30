import { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Heart, Package } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import type { Product } from '@/types';

interface FavoritesListProps {
  products: Product[];
}

export const FavoritesList = memo(function FavoritesList({
  products,
}: FavoritesListProps) {
  const favorites = products.filter((p) => p.is_favorite).slice(0, 5);

  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Favoris
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun favori pour le moment</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajoutez des produits en favoris pour les retrouver facilement
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500 fill-red-500" />
          Favoris
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {favorites.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Image */}
              <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{product.name}</p>
                {product.category && (
                  <p className="text-xs text-muted-foreground truncate">
                    {product.category.name}
                  </p>
                )}
              </div>

              {/* Price */}
              <p className="font-semibold text-sm flex-shrink-0">
                {formatPrice(product.price)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
