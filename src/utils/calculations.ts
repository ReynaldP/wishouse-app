import type { Product, Category, BudgetStats, CategoryStats } from '@/types';

export function calculateBudgetStats(
  products: Product[],
  categories: Category[],
  totalBudget: number,
  currency: string
): BudgetStats {
  const purchasedProducts = products.filter(p => p.status === 'purchased');
  const toBuyProducts = products.filter(p => p.status === 'to_buy');
  const pendingProducts = products.filter(p => p.status === 'pending');

  const purchasedTotal = purchasedProducts.reduce((sum, p) => sum + p.price, 0);
  const toBuyTotal = toBuyProducts.reduce((sum, p) => sum + p.price, 0);
  const pendingTotal = pendingProducts.reduce((sum, p) => sum + p.price, 0);

  const remaining = totalBudget - purchasedTotal - toBuyTotal;
  const percentUsed = totalBudget > 0 ? ((purchasedTotal + toBuyTotal) / totalBudget) * 100 : 0;

  const byCategory: CategoryStats[] = categories.map(cat => {
    const categoryProducts = products.filter(p => p.category_id === cat.id);
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      total: categoryProducts.reduce((sum, p) => sum + p.price, 0),
      count: categoryProducts.length,
      budget: cat.budget
    };
  });

  // Add "Sans catégorie" for products without category
  const uncategorizedProducts = products.filter(p => !p.category_id);
  if (uncategorizedProducts.length > 0) {
    byCategory.push({
      id: 'uncategorized',
      name: 'Sans catégorie',
      color: '#9ca3af',
      total: uncategorizedProducts.reduce((sum, p) => sum + p.price, 0),
      count: uncategorizedProducts.length,
      budget: 0
    });
  }

  const totalProductsValue = products.reduce((sum, p) => sum + p.price, 0);

  return {
    totalBudget,
    currency,
    purchasedTotal,
    toBuyTotal,
    pendingTotal,
    remaining,
    percentUsed: Math.min(percentUsed, 100),
    productCount: products.length,
    averagePrice: products.length > 0 ? totalProductsValue / products.length : 0,
    byCategory: byCategory.sort((a, b) => b.total - a.total),
    byStatus: {
      pending: { count: pendingProducts.length, total: pendingTotal },
      to_buy: { count: toBuyProducts.length, total: toBuyTotal },
      purchased: { count: purchasedProducts.length, total: purchasedTotal }
    }
  };
}

export function calculateCategorySpent(products: Product[], categoryId: string): number {
  return products
    .filter(p => p.category_id === categoryId && p.status !== 'pending')
    .reduce((sum, p) => sum + p.price, 0);
}

export function calculateCategoryProgress(products: Product[], category: Category): number {
  if (category.budget <= 0) return 0;
  const spent = calculateCategorySpent(products, category.id);
  return Math.min((spent / category.budget) * 100, 100);
}

export function getOverBudgetCategories(products: Product[], categories: Category[]): Category[] {
  return categories.filter(cat => {
    const spent = calculateCategorySpent(products, cat.id);
    return cat.budget > 0 && spent > cat.budget;
  });
}

export function getUpcomingPurchases(products: Product[], days: number = 30): Product[] {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return products
    .filter(p => {
      if (!p.planned_date || p.status === 'purchased') return false;
      const plannedDate = new Date(p.planned_date);
      return plannedDate >= now && plannedDate <= futureDate;
    })
    .sort((a, b) => {
      if (!a.planned_date || !b.planned_date) return 0;
      return new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime();
    });
}

export function getOverdueProducts(products: Product[]): Product[] {
  const now = new Date();
  return products
    .filter(p => {
      if (!p.planned_date || p.status === 'purchased') return false;
      return new Date(p.planned_date) < now;
    })
    .sort((a, b) => {
      if (!a.planned_date || !b.planned_date) return 0;
      return new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime();
    });
}
