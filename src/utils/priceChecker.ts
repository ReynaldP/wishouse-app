import type { Product, PriceCheckResult } from '@/types';
import { fetchAndParseProduct, isValidUrl } from './webClipper';

/**
 * Check the current price of a product from its link
 */
export async function checkProductPrice(product: Product): Promise<PriceCheckResult> {
  const result: PriceCheckResult = {
    productId: product.id,
    productName: product.name,
    previousPrice: product.price,
    currentPrice: null,
    hasChanged: false,
    percentChange: 0,
    reachedTarget: false
  };

  // Skip products without a valid link
  if (!product.link || !isValidUrl(product.link)) {
    return result;
  }

  try {
    const clipperResult = await fetchAndParseProduct(product.link);

    if (clipperResult.success && clipperResult.data && clipperResult.data.price !== null) {
      result.currentPrice = clipperResult.data.price;
      result.hasChanged = result.currentPrice !== product.price;

      if (product.price > 0) {
        result.percentChange = ((result.currentPrice - product.price) / product.price) * 100;
      }

      // Check if target price is reached
      if (product.target_price && result.currentPrice <= product.target_price) {
        result.reachedTarget = true;
      }
    }
  } catch (error) {
    console.error(`Failed to check price for product ${product.id}:`, error);
  }

  return result;
}

/**
 * Check prices for multiple products
 */
export async function checkMultipleProductPrices(
  products: Product[],
  onProgress?: (completed: number, total: number) => void
): Promise<PriceCheckResult[]> {
  const results: PriceCheckResult[] = [];
  const total = products.length;

  for (let i = 0; i < products.length; i++) {
    const result = await checkProductPrice(products[i]);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, total);
    }

    // Add a small delay between requests to avoid rate limiting
    if (i < products.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Filter products that are eligible for price checking
 */
export function getCheckableProducts(products: Product[]): Product[] {
  return products.filter(product =>
    product.link &&
    isValidUrl(product.link) &&
    product.price_alert_enabled
  );
}

/**
 * Get products with price drops
 */
export function filterPriceDrops(results: PriceCheckResult[]): PriceCheckResult[] {
  return results.filter(result =>
    result.currentPrice !== null &&
    result.hasChanged &&
    result.percentChange < 0
  );
}

/**
 * Get products that reached their target price
 */
export function filterTargetReached(results: PriceCheckResult[]): PriceCheckResult[] {
  return results.filter(result => result.reachedTarget);
}

/**
 * Format price change for display
 */
export function formatPriceChange(percentChange: number): {
  text: string;
  color: 'green' | 'red' | 'gray';
  icon: 'up' | 'down' | 'stable';
} {
  if (Math.abs(percentChange) < 0.5) {
    return {
      text: 'Stable',
      color: 'gray',
      icon: 'stable'
    };
  }

  if (percentChange < 0) {
    return {
      text: `${Math.abs(percentChange).toFixed(1)}% moins cher`,
      color: 'green',
      icon: 'down'
    };
  }

  return {
    text: `${percentChange.toFixed(1)}% plus cher`,
    color: 'red',
    icon: 'up'
  };
}

/**
 * Calculate savings if buying at current price vs previous price
 */
export function calculateSavings(previousPrice: number, currentPrice: number): number {
  return Math.max(0, previousPrice - currentPrice);
}
