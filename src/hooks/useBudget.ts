import { useQuery } from '@tanstack/react-query';
import { useProducts } from './useProducts';
import { useCategories } from './useCategories';
import { useSettings } from './useSettings';
import { calculateBudgetStats } from '@/utils/calculations';
import type { BudgetStats } from '@/types';

export function useBudget() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: settings, isLoading: loadingSettings } = useSettings();

  return useQuery<BudgetStats>({
    queryKey: ['budget-stats', products, categories, settings],
    queryFn: () => {
      const totalBudget = settings?.total_budget || 10000;
      const currency = settings?.currency || 'EUR';
      return calculateBudgetStats(products, categories, totalBudget, currency);
    },
    enabled: !loadingProducts && !loadingCategories && !loadingSettings
  });
}

export function useBudgetOverview() {
  const { data: stats, isLoading } = useBudget();

  const isOverBudget = stats ? stats.remaining < 0 : false;
  const isWarning = stats ? stats.percentUsed >= 80 && stats.percentUsed < 100 : false;
  const isHealthy = stats ? stats.percentUsed < 80 : true;

  return {
    stats,
    isLoading,
    isOverBudget,
    isWarning,
    isHealthy
  };
}
