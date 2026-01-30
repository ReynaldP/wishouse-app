import { useBudget } from '@/hooks/useBudget';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { BudgetOverview } from '@/components/budget/BudgetOverview';
import { BudgetChart } from '@/components/budget/BudgetChart';
import { BudgetTimeline } from '@/components/budget/BudgetTimeline';
import { BudgetStackedBar } from '@/components/budget/BudgetStackedBar';
import { BudgetTreemap } from '@/components/budget/BudgetTreemap';
import { StatusDistribution } from '@/components/budget/StatusDistribution';
import { CategoryBudget } from '@/components/budget/CategoryBudget';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useFilterStore } from '@/stores/useFilterStore';

export function Budget() {
  const { data: stats, isLoading: loadingStats } = useBudget();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const { data: settings } = useSettings();
  const { setStatus } = useFilterStore();

  if (loadingStats || !stats) {
    return <LoadingSpinner fullScreen />;
  }

  const currency = settings?.currency || 'EUR';

  const handleStatusClick = (status: 'pending' | 'to_buy' | 'purchased') => {
    setStatus(status);
    window.location.href = '/products';
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Budget</h1>
        <p className="text-muted-foreground">
          Gérez et suivez votre budget maison
        </p>
      </div>

      {/* Overview */}
      <BudgetOverview stats={stats} />

      {/* Timeline - Full width */}
      <BudgetTimeline
        products={products}
        currency={currency}
        monthsBack={6}
      />

      {/* Status Distribution + Treemap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusDistribution
          products={products}
          currency={currency}
          onStatusClick={handleStatusClick}
        />
        <BudgetTreemap
          categories={categories}
          products={products}
          currency={currency}
        />
      </div>

      {/* Budget vs Spending */}
      <BudgetStackedBar
        categories={categories}
        stats={stats.byCategory}
        currency={currency}
      />

      {/* Original charts (category bar + status pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetChart
          data={stats.byCategory}
          type="category"
          currency={currency}
        />
        <BudgetChart
          data={stats.byStatus}
          type="status"
          currency={currency}
        />
      </div>

      {/* Category breakdown */}
      <CategoryBudget
        categories={categories}
        products={products}
        currency={currency}
      />
    </div>
  );
}
