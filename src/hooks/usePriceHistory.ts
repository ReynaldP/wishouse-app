import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PriceHistory, PriceHistoryInsert, PriceAlert } from '@/types';
import { toast } from '@/hooks/useToast';

/**
 * Fetch price history for a specific product
 */
export function usePriceHistory(productId: string | null) {
  return useQuery({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', productId)
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      return data as PriceHistory[];
    },
    enabled: !!productId
  });
}

/**
 * Get the latest recorded price for a product
 */
export function useLatestPrice(productId: string | null) {
  return useQuery({
    queryKey: ['latest-price', productId],
    queryFn: async () => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', productId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      return data as PriceHistory | null;
    },
    enabled: !!productId
  });
}

/**
 * Add a new price record to history
 */
export function useAddPriceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: PriceHistoryInsert) => {
      const { data, error } = await supabase
        .from('price_history')
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data as PriceHistory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-history', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['latest-price', data.product_id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

/**
 * Delete a price history record
 */
export function useDeletePriceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('price_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      queryClient.invalidateQueries({ queryKey: ['price-history', productId] });
      queryClient.invalidateQueries({ queryKey: ['latest-price', productId] });
    }
  });
}

/**
 * Get all products with price alerts enabled
 */
export function useProductsWithPriceAlerts() {
  return useQuery({
    queryKey: ['products-with-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('price_alert_enabled', true)
        .not('target_price', 'is', null)
        .not('link', 'eq', '');

      if (error) throw error;
      return data;
    }
  });
}

/**
 * Get products where current price is at or below target price
 */
export function usePriceAlerts() {
  return useQuery({
    queryKey: ['price-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('price_alert_enabled', true)
        .not('target_price', 'is', null);

      if (error) throw error;

      // Filter products where current price <= target price
      const alerts: PriceAlert[] = (data || [])
        .filter(product => product.target_price && product.price <= product.target_price)
        .map(product => ({
          productId: product.id,
          productName: product.name,
          currentPrice: product.price,
          targetPrice: product.target_price!,
          percentBelow: ((product.target_price! - product.price) / product.target_price!) * 100
        }));

      return alerts;
    }
  });
}

/**
 * Update product price and optionally record in history
 */
export function useUpdateProductPrice() {
  const queryClient = useQueryClient();
  const addPriceRecord = useAddPriceRecord();

  return useMutation({
    mutationFn: async ({
      productId,
      newPrice,
      recordInHistory = true,
      source = 'manual' as const
    }: {
      productId: string;
      newPrice: number;
      recordInHistory?: boolean;
      source?: 'manual' | 'auto_check' | 'web_clipper';
    }) => {
      // Update the product price
      const { data, error } = await supabase
        .from('products')
        .update({ price: newPrice })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      // Record in price history if requested
      if (recordInHistory) {
        await addPriceRecord.mutateAsync({
          product_id: productId,
          price: newPrice,
          source
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

/**
 * Calculate price statistics from history
 */
export function usePriceStats(productId: string | null) {
  const { data: history } = usePriceHistory(productId);

  if (!history || history.length === 0) {
    return {
      minPrice: null,
      maxPrice: null,
      avgPrice: null,
      priceChange: null,
      priceChangePercent: null,
      trend: 'stable' as const
    };
  }

  const prices = history.map(h => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Calculate change from first to last recorded price
  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (priceChangePercent > 5) trend = 'up';
  else if (priceChangePercent < -5) trend = 'down';

  return {
    minPrice,
    maxPrice,
    avgPrice,
    priceChange,
    priceChangePercent,
    trend
  };
}
