import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Product, Category, CategoryStats, TimelineDataPoint, TreemapNode, StackedBarData } from '@/types';

export function generateTimelineData(
  products: Product[],
  monthsBack: number = 6
): TimelineDataPoint[] {
  const now = new Date();
  const startDate = startOfMonth(subMonths(now, monthsBack - 1));
  const endDate = endOfMonth(now);

  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  let cumulative = 0;

  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthProducts = products.filter(p => {
      const createdDate = parseISO(p.created_at);
      return isWithinInterval(createdDate, { start: monthStart, end: monthEnd });
    });

    const purchased = monthProducts
      .filter(p => p.status === 'purchased')
      .reduce((sum, p) => sum + p.price, 0);

    const toBuy = monthProducts
      .filter(p => p.status === 'to_buy')
      .reduce((sum, p) => sum + p.price, 0);

    const pending = monthProducts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.price, 0);

    // Projected: products with planned_date in this month
    const projected = products
      .filter(p => {
        if (!p.planned_date || p.status === 'purchased') return false;
        const plannedDate = parseISO(p.planned_date);
        return isWithinInterval(plannedDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, p) => sum + p.price, 0);

    cumulative += purchased;

    return {
      date: month.toISOString(),
      label: format(month, 'MMM yyyy', { locale: fr }),
      purchased,
      to_buy: toBuy,
      pending,
      projected,
      cumulative
    };
  });
}

export function generateTreemapData(
  categories: Category[],
  products: Product[]
): TreemapNode[] {
  return categories
    .map(category => {
      const categoryProducts = products.filter(p => p.category_id === category.id);
      const total = categoryProducts.reduce((sum, p) => sum + p.price, 0);

      return {
        name: category.name,
        value: total,
        color: category.color,
        categoryId: category.id
      };
    })
    .filter(node => node.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function generateTreemapWithSubcategories(
  categories: Category[],
  products: Product[]
): TreemapNode[] {
  return categories
    .map(category => {
      const categoryProducts = products.filter(p => p.category_id === category.id);

      // Group by subcategory
      const subcategoryGroups = new Map<string | null, Product[]>();

      categoryProducts.forEach(p => {
        const key = p.subcategory_id;
        if (!subcategoryGroups.has(key)) {
          subcategoryGroups.set(key, []);
        }
        subcategoryGroups.get(key)!.push(p);
      });

      const children: TreemapNode[] = [];

      subcategoryGroups.forEach((prods, subcategoryId) => {
        const total = prods.reduce((sum, p) => sum + p.price, 0);
        const subcategory = prods[0]?.subcategory;

        if (total > 0) {
          children.push({
            name: subcategory?.name ?? 'Sans sous-catégorie',
            value: total,
            color: category.color,
            subcategoryId: subcategoryId ?? undefined
          });
        }
      });

      const total = categoryProducts.reduce((sum, p) => sum + p.price, 0);

      return {
        name: category.name,
        value: total,
        color: category.color,
        categoryId: category.id,
        children: children.length > 0 ? children.sort((a, b) => b.value - a.value) : undefined
      };
    })
    .filter(node => node.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function generateStackedBarData(
  categories: Category[],
  stats: CategoryStats[]
): StackedBarData[] {
  return categories
    .map(category => {
      const stat = stats.find(s => s.id === category.id);
      const spent = stat?.total ?? 0;
      const allocated = category.budget || 0;
      const remaining = Math.max(0, allocated - spent);

      return {
        name: category.name,
        allocated,
        spent,
        remaining,
        color: category.color,
        categoryId: category.id
      };
    })
    .filter(item => item.allocated > 0 || item.spent > 0)
    .sort((a, b) => b.spent - a.spent);
}

export function generateStatusData(products: Product[]): {
  status: string;
  label: string;
  count: number;
  total: number;
  color: string;
}[] {
  const statusConfig = {
    pending: { label: 'En attente', color: '#9ca3af' },
    to_buy: { label: 'À acheter', color: '#f59e0b' },
    purchased: { label: 'Acheté', color: '#22c55e' }
  };

  return (Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(status => {
    const filtered = products.filter(p => p.status === status);
    return {
      status,
      label: statusConfig[status].label,
      count: filtered.length,
      total: filtered.reduce((sum, p) => sum + p.price, 0),
      color: statusConfig[status].color
    };
  });
}

export function calculateProjectedSpending(
  products: Product[],
  months: number = 3
): number {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + months);

  return products
    .filter(p => {
      if (p.status === 'purchased' || !p.planned_date) return false;
      const plannedDate = parseISO(p.planned_date);
      return isWithinInterval(plannedDate, { start: now, end: futureDate });
    })
    .reduce((sum, p) => sum + p.price, 0);
}

export const STATUS_COLORS = {
  pending: '#9ca3af',
  to_buy: '#f59e0b',
  purchased: '#22c55e'
} as const;

export const STATUS_LABELS = {
  pending: 'En attente',
  to_buy: 'À acheter',
  purchased: 'Acheté'
} as const;
