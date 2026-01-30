import { useProducts } from '@/hooks/useProducts';
import { useBudget } from '@/hooks/useBudget';
import { useSettings } from '@/hooks/useSettings';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentProducts } from '@/components/dashboard/RecentProducts';
import { UpcomingPurchases } from '@/components/dashboard/UpcomingPurchases';
import { FavoritesList } from '@/components/dashboard/FavoritesList';
import { BudgetChart } from '@/components/budget/BudgetChart';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getUpcomingPurchases, getOverdueProducts } from '@/utils/calculations';

export function Dashboard() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: stats, isLoading: loadingStats } = useBudget();
  const { data: settings } = useSettings();

  const isLoading = loadingProducts || loadingStats;
  const currency = settings?.currency || 'EUR';

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const upcomingProducts = getUpcomingPurchases(products, 30);
  const overdueProducts = getOverdueProducts(products);
  const allUpcoming = [...overdueProducts, ...upcomingProducts].slice(0, 5);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre budget maison
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Budget total"
          value={stats?.totalBudget || 0}
          icon="wallet"
          format="currency"
          currency={currency}
        />
        <StatCard
          title="Acheté"
          value={stats?.purchasedTotal || 0}
          icon="shopping-bag"
          format="currency"
          variant="success"
          currency={currency}
          subtitle={`${stats?.byStatus.purchased.count || 0} produits`}
        />
        <StatCard
          title="À acheter"
          value={stats?.toBuyTotal || 0}
          icon="shopping-cart"
          format="currency"
          variant="warning"
          currency={currency}
          subtitle={`${stats?.byStatus.to_buy.count || 0} produits`}
        />
        <StatCard
          title="Restant"
          value={stats?.remaining || 0}
          icon="piggy-bank"
          format="currency"
          variant={stats?.remaining && stats.remaining < 0 ? 'destructive' : 'default'}
          currency={currency}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetChart
          data={stats?.byCategory || []}
          type="category"
          currency={currency}
        />
        <BudgetChart
          data={stats?.byStatus || { pending: { count: 0, total: 0 }, to_buy: { count: 0, total: 0 }, purchased: { count: 0, total: 0 } }}
          type="status"
          currency={currency}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentProducts products={products.slice(0, 5)} />
        <div className="space-y-6">
          <UpcomingPurchases products={allUpcoming} />
          <FavoritesList products={products} />
        </div>
      </div>
    </div>
  );
}
