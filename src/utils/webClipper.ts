import type { ClippedProduct, WebClipperResult } from '@/types';

// Multiple CORS proxies for fallback
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// Common price patterns for different locales (more comprehensive)
const PRICE_PATTERNS = [
  // Euro patterns
  /(?:€|EUR)\s*([0-9]+(?:[.,][0-9]{2})?)/i,
  /([0-9]+(?:[.,][0-9]{2})?)\s*(?:€|EUR)/i,
  // Data attributes
  /data-price["\s=:]+["']?([0-9]+(?:[.,][0-9]{2})?)/i,
  /data-product-price["\s=:]+["']?([0-9]+(?:[.,][0-9]{2})?)/i,
  // JSON/Schema patterns
  /"price"\s*:\s*"?([0-9]+(?:[.,][0-9]{2})?)/i,
  /"amount"\s*:\s*"?([0-9]+(?:[.,][0-9]{2})?)/i,
  // Class/ID patterns
  /class="[^"]*price[^"]*"[^>]*>([0-9]+(?:[.,][0-9]{2})?)\s*€/i,
  /itemprop="price"[^>]*content="([0-9]+(?:[.,][0-9]{2})?)"/i,
];

// Helper to find first matching selector
function findText(doc: Document, selectors: string[]): string | null {
  for (const selector of selectors) {
    const el = doc.querySelector(selector);
    if (el?.textContent?.trim()) {
      return el.textContent.trim();
    }
  }
  return null;
}

function findAttribute(doc: Document, selectors: string[], attribute: string): string | null {
  for (const selector of selectors) {
    const el = doc.querySelector(selector);
    const value = el?.getAttribute(attribute);
    if (value) return value;
  }
  return null;
}

function parsePrice(text: string | null): number | null {
  if (!text) return null;
  // Remove all non-numeric except comma and dot
  const cleaned = text.replace(/[^\d.,]/g, '').replace(',', '.');
  // Handle cases like "1.299.99" (thousand separator)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    // Assume last part is decimal
    const decimal = parts.pop();
    const whole = parts.join('');
    return parseFloat(`${whole}.${decimal}`);
  }
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

// Known e-commerce site parsers with multiple selector fallbacks
const SITE_PARSERS: Record<string, (doc: Document, url: string) => Partial<ClippedProduct>> = {
  'amazon': (doc) => {
    const name = findText(doc, [
      '#productTitle',
      '[data-feature-name="title"]',
      '#title span',
      'h1#title',
      '.product-title-word-break'
    ]);

    // Try multiple price selectors
    const priceWhole = findText(doc, [
      '.a-price-whole',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.apexPriceToPay .a-price-whole',
      '[data-a-color="price"] .a-price-whole'
    ]);
    const priceFraction = findText(doc, ['.a-price-fraction']) || '00';
    let price: number | null = null;

    if (priceWhole) {
      price = parseFloat(`${priceWhole.replace(/[^\d]/g, '')}.${priceFraction.replace(/[^\d]/g, '')}`);
    }

    // Fallback: try to find price in meta tags or data attributes
    if (!price) {
      const metaPrice = doc.querySelector('meta[itemprop="price"]')?.getAttribute('content');
      if (metaPrice) price = parsePrice(metaPrice);
    }

    const image = findAttribute(doc, [
      '#landingImage',
      '#imgBlkFront',
      '#main-image',
      '.a-dynamic-image',
      '[data-a-dynamic-image]'
    ], 'src');

    return { name: name || '', price, image_url: image || '' };
  },

  'ikea': (doc) => {
    const name = findText(doc, [
      '.pip-header-section h1',
      '[data-testid="product-name"]',
      '.js-product-name',
      'h1.range-revamp-header-section__title--big',
      '.product-pip h1'
    ]);

    const priceText = findText(doc, [
      '.pip-price__integer',
      '[data-testid="price-value"]',
      '.pip-temp-price__integer',
      '.range-revamp-price__integer',
      '.product-pip__price-value'
    ]);
    const price = parsePrice(priceText);

    const image = findAttribute(doc, [
      '.pip-image img',
      '.pip-media-grid__image img',
      '[data-testid="product-image"] img'
    ], 'src');

    return { name: name || '', price, image_url: image || '' };
  },

  'leroymerlin': (doc) => {
    const name = findText(doc, [
      'h1.product-header__title',
      '[data-testid="product-title"]',
      '.c-product-title h1',
      'h1[itemprop="name"]',
      '.product-name h1'
    ]);

    const priceText = findText(doc, [
      '.product-price__value',
      '[data-testid="product-price"]',
      '.c-product-price__value',
      '[itemprop="price"]',
      '.price-primary'
    ]);
    const price = parsePrice(priceText);

    const image = findAttribute(doc, [
      '.product-image img',
      '[data-testid="product-image"] img',
      '.product-gallery__main-image img'
    ], 'src');

    return { name: name || '', price, image_url: image || '' };
  },

  'cdiscount': (doc) => {
    const name = findText(doc, [
      'h1[itemprop="name"]',
      '.product-info h1',
      '.fpDesCol h1',
      '[data-testid="product-title"]'
    ]);

    // Cdiscount often has price in meta/schema
    let price: number | null = null;
    const priceContent = doc.querySelector('[itemprop="price"]')?.getAttribute('content');
    if (priceContent) {
      price = parsePrice(priceContent);
    }
    if (!price) {
      const priceText = findText(doc, [
        '.fpPrice',
        '.fpPriceInt',
        '.product-price__amount-unit',
        '.price-container .price'
      ]);
      price = parsePrice(priceText);
    }

    const image = findAttribute(doc, [
      '[itemprop="image"]',
      '.fpGalImg img',
      '.product-image img'
    ], 'src') || findAttribute(doc, ['[itemprop="image"]'], 'content');

    return { name: name || '', price, image_url: image || '' };
  },

  'fnac': (doc) => {
    const name = findText(doc, [
      'h1.f-productHeader-Title',
      '.f-productHeader__title',
      '[data-automation-id="product-title"]',
      'h1.Product-title'
    ]);

    const priceText = findText(doc, [
      '.f-priceBox-price',
      '.f-priceBox__price',
      '[data-automation-id="product-price"]',
      '.userPrice .price'
    ]);
    const price = parsePrice(priceText);

    const image = findAttribute(doc, [
      '.f-productVisuals-mainMedia img',
      '.f-productVisuals__mainMedia img',
      '[data-automation-id="product-image"] img'
    ], 'src');

    return { name: name || '', price, image_url: image || '' };
  },

  'boulanger': (doc) => {
    const name = findText(doc, [
      'h1.c-product__title',
      '.product-title h1',
      '[data-testid="product-name"]',
      '.page-product h1'
    ]);

    const priceText = findText(doc, [
      '.c-price__value',
      '.c-price .price',
      '[data-testid="product-price"]',
      '.price-value'
    ]);
    const price = parsePrice(priceText);

    const image = findAttribute(doc, [
      '.c-product-visual__img',
      '.product-image img',
      '[data-testid="product-image"] img'
    ], 'src');

    return { name: name || '', price, image_url: image || '' };
  },

  'conforama': (doc) => {
    const name = findText(doc, [
      'h1.pdp-title',
      '.product-title h1',
      '[itemprop="name"]',
      '.product-name'
    ]);

    const priceText = findText(doc, [
      '.price-value',
      '.price-container .price',
      '[itemprop="price"]',
      '.product-price'
    ]);
    const price = parsePrice(priceText);

    const image = findAttribute(doc, [
      '.pdp-main-image img',
      '.product-image img',
      '[itemprop="image"]'
    ], 'src');

    return { name: name || '', price, image_url: image || '' };
  },

  'but': (doc) => {
    const name = findText(doc, [
      'h1.product-title',
      '.but-product-title h1',
      '[data-testid="product-title"]',
      '.product-detail h1'
    ]);

    const priceText = findText(doc, [
      '.product-price',
      '.but-price',
      '[data-testid="product-price"]',
      '.price-value'
    ]);
    const price = parsePrice(priceText);

    const image = findAttribute(doc, [
      '.product-image img',
      '.but-product-image img',
      '[data-testid="product-image"] img'
    ], 'src');

    return { name: name || '', price, image_url: image || '' };
  },

  'darty': (doc) => {
    const name = findText(doc, [
      'h1.product-title',
      '.darty-product-title h1',
      '[data-testid="product-title"]'
    ]);

    const priceText = findText(doc, [
      '.product-price',
      '.darty-price',
      '[data-testid="product-price"]'
    ]);
    const price = parsePrice(priceText);

    const image = findAttribute(doc, [
      '.product-image img',
      '.darty-product-image img'
    ], 'src');

    return { name: name || '', price, image_url: image || '' };
  },

  'castorama': (doc) => {
    const name = findText(doc, [
      'h1.product-title',
      '[data-testid="product-title"]',
      '.product-name h1'
    ]);

    const priceText = findText(doc, [
      '.product-price',
      '[data-testid="product-price"]',
      '.price-value'
    ]);
    const price = parsePrice(priceText);

    const image = findAttribute(doc, [
      '.product-image img',
      '[data-testid="product-image"] img'
    ], 'src');

    return { name: name || '', price, image_url: image || '' };
  },
};

// Extract source site from URL
function getSiteKey(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const key of Object.keys(SITE_PARSERS)) {
      if (hostname.includes(key)) {
        return key;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Extract price from JSON-LD structured data
function extractPriceFromJsonLd(doc: Document): number | null {
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || '');

      // Handle @graph array (common format)
      if (data['@graph']) {
        for (const item of data['@graph']) {
          if (item['@type'] === 'Product' || item['@type'] === 'Offer') {
            const offers = item.offers || item;
            const priceValue = offers?.price || offers?.lowPrice || offers?.highPrice;
            if (priceValue) {
              return parsePrice(String(priceValue));
            }
          }
        }
      }

      // Direct Product type
      if (data['@type'] === 'Product') {
        const offers = data.offers;
        if (Array.isArray(offers)) {
          for (const offer of offers) {
            if (offer.price) return parsePrice(String(offer.price));
          }
        } else if (offers?.price) {
          return parsePrice(String(offers.price));
        }
      }

      // Direct Offer type
      if (data['@type'] === 'Offer' && data.price) {
        return parsePrice(String(data.price));
      }

      // AggregateOffer
      if (data['@type'] === 'AggregateOffer') {
        const priceValue = data.lowPrice || data.highPrice || data.price;
        if (priceValue) return parsePrice(String(priceValue));
      }

    } catch {
      // Ignore parsing errors
    }
  }

  return null;
}

// Extract product info from JSON-LD
function extractProductFromJsonLd(doc: Document): Partial<ClippedProduct> {
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || '');

      // Find Product in @graph
      let product = null;
      if (data['@graph']) {
        product = data['@graph'].find((item: Record<string, unknown>) =>
          item['@type'] === 'Product'
        );
      } else if (data['@type'] === 'Product') {
        product = data;
      }

      if (product) {
        const offers = product.offers;
        let price: number | null = null;

        if (Array.isArray(offers)) {
          price = parsePrice(String(offers[0]?.price));
        } else if (offers?.price) {
          price = parsePrice(String(offers.price));
        }

        return {
          name: product.name || '',
          price,
          image_url: Array.isArray(product.image) ? product.image[0] : product.image || '',
          description: product.description || ''
        };
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return {};
}

// Generic Open Graph / meta tag parser
function parseGenericMeta(doc: Document): Partial<ClippedProduct> {
  // Try JSON-LD first (most reliable for e-commerce)
  const jsonLdData = extractProductFromJsonLd(doc);
  if (jsonLdData.name && jsonLdData.price) {
    return jsonLdData;
  }

  // Try Open Graph tags
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const ogPrice = doc.querySelector('meta[property="og:price:amount"]')?.getAttribute('content') ||
                  doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content');

  // Fallback to standard meta tags
  const title = jsonLdData.name || ogTitle ||
                doc.querySelector('meta[name="title"]')?.getAttribute('content') ||
                doc.querySelector('title')?.textContent?.trim();

  const description = jsonLdData.description || ogDescription ||
                      doc.querySelector('meta[name="description"]')?.getAttribute('content');

  const image = jsonLdData.image_url || ogImage ||
                doc.querySelector('meta[name="image"]')?.getAttribute('content');

  // Try to find price in various ways
  let price: number | null = jsonLdData.price ?? null;

  if (price === null && ogPrice) {
    price = parsePrice(ogPrice);
  }

  // Try JSON-LD specifically for price
  if (price === null) {
    price = extractPriceFromJsonLd(doc);
  }

  // Try price patterns in the HTML as last resort
  if (price === null) {
    const html = doc.body?.innerHTML || '';
    for (const pattern of PRICE_PATTERNS) {
      const match = html.match(pattern);
      if (match && match[1]) {
        price = parsePrice(match[1]);
        if (price !== null) break;
      }
    }
  }

  return {
    name: title || '',
    price,
    image_url: image || '',
    description: description || '',
  };
}

// Parse HTML content and extract product info
export function parseProductFromHtml(html: string, url: string): WebClipperResult {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const siteKey = getSiteKey(url);
    let result: Partial<ClippedProduct>;

    if (siteKey && SITE_PARSERS[siteKey]) {
      // Use site-specific parser
      result = SITE_PARSERS[siteKey](doc, url);
      // Fallback to generic for missing fields
      const generic = parseGenericMeta(doc);
      result = {
        name: result.name || generic.name,
        price: result.price ?? generic.price,
        image_url: result.image_url || generic.image_url,
        description: result.description || generic.description,
      };
    } else {
      // Use generic parser
      result = parseGenericMeta(doc);
    }

    const hostname = new URL(url).hostname.replace('www.', '');

    return {
      success: true,
      data: {
        name: result.name || 'Produit sans nom',
        price: result.price ?? null,
        image_url: result.image_url || '',
        link: url,
        description: result.description || '',
        source: hostname,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du parsing',
    };
  }
}

// Check if the HTML indicates a blocked request (CAPTCHA, access denied, etc.)
function isBlockedResponse(html: string): boolean {
  const blockedIndicators = [
    'captcha',
    'robot',
    'access denied',
    'accès refusé',
    'please verify',
    'veuillez vérifier',
    'automated access',
    'blocked',
    'forbidden',
    'rate limit',
    'too many requests',
    'unusual traffic'
  ];
  const lowerHtml = html.toLowerCase();
  return blockedIndicators.some(indicator => lowerHtml.includes(indicator));
}

// Check if HTML content is valid (not empty, not an error page)
function isValidHtmlContent(html: string): boolean {
  if (!html || html.length < 500) return false;
  // Check for basic HTML structure
  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) return false;
  // Check if it's not just an error page
  if (html.includes('<title>Error</title>') || html.includes('<title>404</title>')) return false;
  return true;
}

// Fetch URL and parse product info (with multiple CORS proxy fallbacks)
export async function fetchAndParseProduct(url: string): Promise<WebClipperResult> {
  let lastError = 'Erreur de connexion';

  // Try each CORS proxy until one works
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = CORS_PROXIES[i](url);

      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }

      const html = await response.text();

      // Check if we got valid content
      if (!isValidHtmlContent(html)) {
        lastError = 'Contenu invalide reçu';
        continue;
      }

      // Check if the site blocked us
      if (isBlockedResponse(html)) {
        lastError = 'Site protégé contre les robots';
        continue;
      }

      const result = parseProductFromHtml(html, url);

      // If we got a result with a price, return it
      if (result.success && result.data?.price !== null) {
        return result;
      }

      // If we got a result without a price, keep trying other proxies
      // but save this result in case all proxies fail
      if (result.success) {
        lastError = 'Prix non trouvé sur la page';
      }

      // Continue to next proxy if no price found
      if (i < CORS_PROXIES.length - 1) {
        continue;
      }

      // Last proxy, return whatever we have
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Erreur de connexion';
      // Continue to next proxy
    }
  }

  return {
    success: false,
    error: lastError,
  };
}

// Parse shared text (from Share API) to extract URL
export function extractUrlFromText(text: string): string | null {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const matches = text.match(urlPattern);
  return matches ? matches[0] : null;
}

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

// Search URL templates for supported sites
const SEARCH_URLS: Record<string, (query: string) => string> = {
  amazon: (q) => `https://www.amazon.fr/s?k=${encodeURIComponent(q)}`,
  ikea: (q) => `https://www.ikea.com/fr/fr/search/?q=${encodeURIComponent(q)}`,
  leroymerlin: (q) => `https://www.leroymerlin.fr/recherche?q=${encodeURIComponent(q)}`,
  cdiscount: (q) => `https://www.cdiscount.com/search/10/${encodeURIComponent(q)}.html`,
  fnac: (q) => `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${encodeURIComponent(q)}`,
  boulanger: (q) => `https://www.boulanger.com/resultats?tr=${encodeURIComponent(q)}`,
  conforama: (q) => `https://www.conforama.fr/search?q=${encodeURIComponent(q)}`,
  but: (q) => `https://www.but.fr/recherche?q=${encodeURIComponent(q)}`,
  darty: (q) => `https://www.darty.com/nav/recherche?text=${encodeURIComponent(q)}`,
  castorama: (q) => `https://www.castorama.fr/search?q=${encodeURIComponent(q)}`,
};

export type SupportedSite = keyof typeof SEARCH_URLS;

export const SUPPORTED_SITES: { key: SupportedSite; name: string }[] = [
  { key: 'amazon', name: 'Amazon' },
  { key: 'ikea', name: 'IKEA' },
  { key: 'leroymerlin', name: 'Leroy Merlin' },
  { key: 'cdiscount', name: 'Cdiscount' },
  { key: 'fnac', name: 'Fnac' },
  { key: 'boulanger', name: 'Boulanger' },
  { key: 'conforama', name: 'Conforama' },
  { key: 'but', name: 'But' },
  { key: 'darty', name: 'Darty' },
  { key: 'castorama', name: 'Castorama' },
];

/**
 * Generate a search URL for a specific site
 */
export function getSearchUrl(site: SupportedSite, query: string): string {
  const urlGenerator = SEARCH_URLS[site];
  if (!urlGenerator) {
    throw new Error(`Unknown site: ${site}`);
  }
  return urlGenerator(query);
}

/**
 * Get site name from key
 */
export function getSiteName(siteKey: string): string {
  const site = SUPPORTED_SITES.find(s => s.key === siteKey);
  return site?.name || siteKey;
}

/**
 * Open search results in a new tab
 */
export function openSearchInNewTab(site: SupportedSite, query: string): void {
  const url = getSearchUrl(site, query);
  window.open(url, '_blank');
}
