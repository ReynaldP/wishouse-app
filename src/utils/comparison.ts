import { Product, ComparisonHighlight, ComparisonField, Priority } from '@/types';

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1
};

export function calculateComparisonHighlights(products: Product[]): ComparisonHighlight[] {
  if (products.length < 2) return [];

  const highlights: ComparisonHighlight[] = [];

  // Price comparison (lowest is best)
  const prices = products.map(p => ({ id: p.id, value: p.price }));
  const minPrice = Math.min(...prices.map(p => p.value));
  const maxPrice = Math.max(...prices.map(p => p.value));

  if (minPrice !== maxPrice) {
    prices.forEach(p => {
      highlights.push({
        field: 'price',
        productId: p.id,
        type: p.value === minPrice ? 'best' : p.value === maxPrice ? 'worst' : 'neutral'
      });
    });
  }

  // Priority comparison (high is best)
  const priorities = products.map(p => ({ id: p.id, value: PRIORITY_ORDER[p.priority] }));
  const maxPriority = Math.max(...priorities.map(p => p.value));
  const minPriority = Math.min(...priorities.map(p => p.value));

  if (maxPriority !== minPriority) {
    priorities.forEach(p => {
      highlights.push({
        field: 'priority',
        productId: p.id,
        type: p.value === maxPriority ? 'best' : p.value === minPriority ? 'worst' : 'neutral'
      });
    });
  }

  // Planned date (earliest non-null is best for to_buy items)
  const datesWithProducts = products
    .filter(p => p.planned_date && p.status === 'to_buy')
    .map(p => ({ id: p.id, value: new Date(p.planned_date!).getTime() }));

  if (datesWithProducts.length >= 2) {
    const earliestDate = Math.min(...datesWithProducts.map(d => d.value));
    const latestDate = Math.max(...datesWithProducts.map(d => d.value));

    if (earliestDate !== latestDate) {
      datesWithProducts.forEach(d => {
        highlights.push({
          field: 'planned_date',
          productId: d.id,
          type: d.value === earliestDate ? 'best' : d.value === latestDate ? 'worst' : 'neutral'
        });
      });
    }
  }

  return highlights;
}

export function calculateProductScore(product: Product): number {
  let score = 0;

  // Priority contributes 30%
  score += PRIORITY_ORDER[product.priority] * 10;

  // Status contributes 20%
  const statusScore = { pending: 5, to_buy: 15, purchased: 20 };
  score += statusScore[product.status];

  // Pros/Cons balance contributes 20%
  const prosCount = product.pros ? product.pros.split('\n').filter(l => l.trim()).length : 0;
  const consCount = product.cons ? product.cons.split('\n').filter(l => l.trim()).length : 0;
  const balance = prosCount - consCount;
  score += Math.max(0, Math.min(20, 10 + balance * 2));

  // Has planned date contributes 10%
  if (product.planned_date) score += 10;

  // Has image contributes 10%
  if (product.image_url) score += 10;

  // Has link contributes 10%
  if (product.link) score += 10;

  return Math.min(100, score);
}

export function canCompareProducts(products: Product[]): { canCompare: boolean; reason?: string } {
  if (products.length < 2) {
    return { canCompare: false, reason: 'Sélectionnez au moins 2 produits' };
  }

  if (products.length > 4) {
    return { canCompare: false, reason: 'Maximum 4 produits' };
  }

  return { canCompare: true };
}

export function getHighlightForField(
  highlights: ComparisonHighlight[],
  field: ComparisonField,
  productId: string
): 'best' | 'worst' | 'neutral' | null {
  const highlight = highlights.find(h => h.field === field && h.productId === productId);
  return highlight?.type ?? null;
}

export function getHighlightClass(type: 'best' | 'worst' | 'neutral' | null): string {
  switch (type) {
    case 'best':
      return 'bg-success/10 text-success border-success/30';
    case 'worst':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    default:
      return '';
  }
}
