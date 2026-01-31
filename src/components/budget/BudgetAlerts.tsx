import { memo, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { parseISO, isPast, differenceInDays } from 'date-fns';
import { formatPrice } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Product, Category, BudgetStats, BudgetAlert } from '@/types';

interface BudgetAlertsProps {
  products: Product[];
  categories: Category[];
  stats: BudgetStats;
  currency?: string;
  onDismiss?: (index: number) => void;
}

export const BudgetAlerts = memo(function BudgetAlerts({
  products,
  categories,
  stats,
  currency = 'EUR',
}: BudgetAlertsProps) {
  // Generate alerts based on various conditions
  const alerts = useMemo(() => {
    const alertsList: BudgetAlert[] = [];

    // 1. Overall budget warning (>80%)
    if (stats.percentUsed >= 80 && stats.percentUsed < 100) {
      alertsList.push({
        type: 'warning',
        message: `Vous avez utilisé ${stats.percentUsed.toFixed(0)}% de votre budget total. Il vous reste ${formatPrice(stats.remaining, currency)}.`,
      });
    }

    // 2. Budget exceeded
    if (stats.remaining < 0) {
      alertsList.push({
        type: 'danger',
        message: `Budget dépassé de ${formatPrice(Math.abs(stats.remaining), currency)} ! Pensez à revoir vos priorités.`,
      });
    }

    // 3. Category budget warnings
    categories.forEach((cat) => {
      if (cat.budget <= 0) return;

      const categoryProducts = products.filter(p =>
        p.category_id === cat.id && p.status !== 'pending'
      );
      const spent = categoryProducts.reduce((sum, p) => sum + p.price, 0);
      const percentUsed = (spent / cat.budget) * 100;

      if (percentUsed > 100) {
        alertsList.push({
          type: 'danger',
          message: `La catégorie "${cat.name}" a dépassé son budget de ${formatPrice(spent - cat.budget, currency)}`,
          categoryId: cat.id,
          categoryName: cat.name,
        });
      } else if (percentUsed >= 80) {
        alertsList.push({
          type: 'warning',
          message: `La catégorie "${cat.name}" a atteint ${percentUsed.toFixed(0)}% de son budget`,
          categoryId: cat.id,
          categoryName: cat.name,
        });
      }
    });

    // 4. Overdue purchases
    const overdueProducts = products.filter((p) => {
      if (!p.planned_date || p.status === 'purchased') return false;
      return isPast(parseISO(p.planned_date));
    });

    if (overdueProducts.length > 0) {
      alertsList.push({
        type: 'warning',
        message: `${overdueProducts.length} produit${overdueProducts.length > 1 ? 's' : ''} en retard sur la date prévue d'achat`,
      });
    }

    // 5. Upcoming big purchases (>10% of remaining budget)
    const upcomingBigPurchases = products.filter((p) => {
      if (!p.planned_date || p.status === 'purchased') return false;
      const daysUntil = differenceInDays(parseISO(p.planned_date), new Date());
      return daysUntil > 0 && daysUntil <= 14 && p.price > stats.remaining * 0.1;
    });

    if (upcomingBigPurchases.length > 0 && stats.remaining > 0) {
      alertsList.push({
        type: 'info',
        message: `${upcomingBigPurchases.length} achat${upcomingBigPurchases.length > 1 ? 's' : ''} important${upcomingBigPurchases.length > 1 ? 's' : ''} prévu${upcomingBigPurchases.length > 1 ? 's' : ''} dans les 2 prochaines semaines`,
      });
    }

    // 6. Many pending items
    const pendingCount = products.filter(p => p.status === 'pending').length;
    const pendingTotal = stats.pendingTotal;

    if (pendingCount >= 5 && pendingTotal > stats.remaining) {
      alertsList.push({
        type: 'info',
        message: `${pendingCount} produits en attente pour un total de ${formatPrice(pendingTotal, currency)}. Priorisez vos achats !`,
      });
    }

    return alertsList;
  }, [products, categories, stats, currency]);

  // Get icon based on alert type
  const getAlertIcon = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'danger':
        return AlertTriangle;
      case 'warning':
        return AlertCircle;
      case 'info':
      default:
        return Info;
    }
  };

  // Get styles based on alert type
  const getAlertStyles = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'danger':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'info':
      default:
        return 'bg-primary/10 border-primary/20 text-primary';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="bg-success/5 border-success/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-success">Tout va bien !</p>
              <p className="text-sm text-muted-foreground">
                Votre budget est sous contrôle
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes
          </CardTitle>
          <Badge variant="secondary">
            {alerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.slice(0, 5).map((alert, index) => {
          const Icon = getAlertIcon(alert.type);
          return (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                getAlertStyles(alert.type)
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{alert.message}</p>
            </div>
          );
        })}

        {alerts.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{alerts.length - 5} autre{alerts.length - 5 > 1 ? 's' : ''} alerte{alerts.length - 5 > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
});
