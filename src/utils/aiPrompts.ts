/**
 * AI Prompts for product recommendations
 */

export const SUPPORTED_SITES = [
  { key: 'amazon', name: 'Amazon', searchUrl: 'https://www.amazon.fr/s?k=' },
  { key: 'ikea', name: 'IKEA', searchUrl: 'https://www.ikea.com/fr/fr/search/?q=' },
  { key: 'leroymerlin', name: 'Leroy Merlin', searchUrl: 'https://www.leroymerlin.fr/recherche?q=' },
  { key: 'cdiscount', name: 'Cdiscount', searchUrl: 'https://www.cdiscount.com/search/10/' },
  { key: 'fnac', name: 'Fnac', searchUrl: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=' },
  { key: 'boulanger', name: 'Boulanger', searchUrl: 'https://www.boulanger.com/resultats?tr=' },
  { key: 'conforama', name: 'Conforama', searchUrl: 'https://www.conforama.fr/search?q=' },
  { key: 'but', name: 'But', searchUrl: 'https://www.but.fr/recherche?q=' },
] as const;

export type SupportedSite = typeof SUPPORTED_SITES[number]['key'];

/**
 * Generate a search URL for a specific site
 */
export function getSearchUrl(site: SupportedSite, query: string): string {
  const siteConfig = SUPPORTED_SITES.find(s => s.key === site);
  if (!siteConfig) {
    throw new Error(`Unknown site: ${site}`);
  }
  return siteConfig.searchUrl + encodeURIComponent(query);
}

/**
 * Get site display name
 */
export function getSiteName(siteKey: string): string {
  const site = SUPPORTED_SITES.find(s => s.key === siteKey);
  return site?.name || siteKey;
}

/**
 * Generate optimized search query from product info
 */
export function generateSearchQuery(
  productName: string,
  category?: string
): string {
  // Remove common noise words
  const noiseWords = ['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'pour'];

  let query = productName
    .toLowerCase()
    .split(' ')
    .filter(word => !noiseWords.includes(word) && word.length > 2)
    .join(' ');

  // Add category context if relevant
  if (category && !query.toLowerCase().includes(category.toLowerCase())) {
    query = `${query} ${category}`;
  }

  return query.trim();
}
