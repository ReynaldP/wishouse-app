import type { ClippedProduct, WebClipperResult } from '@/types';

// Common price patterns for different locales
const PRICE_PATTERNS = [
  /(?:€|EUR)\s*([0-9]+(?:[.,][0-9]{2})?)/i,
  /([0-9]+(?:[.,][0-9]{2})?)\s*(?:€|EUR)/i,
  /price["\s:]+([0-9]+(?:[.,][0-9]{2})?)/i,
  /data-price["\s=:]+["']?([0-9]+(?:[.,][0-9]{2})?)/i,
];

// Known e-commerce site parsers
const SITE_PARSERS: Record<string, (doc: Document, url: string) => Partial<ClippedProduct>> = {
  'amazon': (doc) => {
    const name = doc.querySelector('#productTitle')?.textContent?.trim() ||
                 doc.querySelector('[data-feature-name="title"]')?.textContent?.trim();
    const priceWhole = doc.querySelector('.a-price-whole')?.textContent?.replace(/[^\d]/g, '');
    const priceFraction = doc.querySelector('.a-price-fraction')?.textContent?.replace(/[^\d]/g, '') || '00';
    const price = priceWhole ? parseFloat(`${priceWhole}.${priceFraction}`) : null;
    const image = doc.querySelector('#landingImage')?.getAttribute('src') ||
                  doc.querySelector('#imgBlkFront')?.getAttribute('src');

    return { name: name || '', price, image_url: image || '' };
  },
  'ikea': (doc) => {
    const name = doc.querySelector('.pip-header-section h1')?.textContent?.trim() ||
                 doc.querySelector('[data-testid="product-name"]')?.textContent?.trim();
    const priceText = doc.querySelector('.pip-price__integer')?.textContent ||
                      doc.querySelector('[data-testid="price-value"]')?.textContent;
    const price = priceText ? parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    const image = doc.querySelector('.pip-image img')?.getAttribute('src');

    return { name: name || '', price, image_url: image || '' };
  },
  'leroymerlin': (doc) => {
    const name = doc.querySelector('h1.product-header__title')?.textContent?.trim() ||
                 doc.querySelector('[data-testid="product-title"]')?.textContent?.trim();
    const priceText = doc.querySelector('.product-price__value')?.textContent ||
                      doc.querySelector('[data-testid="product-price"]')?.textContent;
    const price = priceText ? parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    const image = doc.querySelector('.product-image img')?.getAttribute('src');

    return { name: name || '', price, image_url: image || '' };
  },
  'cdiscount': (doc) => {
    const name = doc.querySelector('h1[itemprop="name"]')?.textContent?.trim();
    const priceText = doc.querySelector('[itemprop="price"]')?.getAttribute('content') ||
                      doc.querySelector('.fpPrice')?.textContent;
    const price = priceText ? parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    const image = doc.querySelector('[itemprop="image"]')?.getAttribute('src');

    return { name: name || '', price, image_url: image || '' };
  },
  'fnac': (doc) => {
    const name = doc.querySelector('h1.f-productHeader-Title')?.textContent?.trim();
    const priceText = doc.querySelector('.f-priceBox-price')?.textContent;
    const price = priceText ? parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    const image = doc.querySelector('.f-productVisuals-mainMedia img')?.getAttribute('src');

    return { name: name || '', price, image_url: image || '' };
  },
  'boulanger': (doc) => {
    const name = doc.querySelector('h1.c-product__title')?.textContent?.trim();
    const priceText = doc.querySelector('.c-price__value')?.textContent;
    const price = priceText ? parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    const image = doc.querySelector('.c-product-visual__img')?.getAttribute('src');

    return { name: name || '', price, image_url: image || '' };
  },
  'conforama': (doc) => {
    const name = doc.querySelector('h1.pdp-title')?.textContent?.trim();
    const priceText = doc.querySelector('.price-value')?.textContent;
    const price = priceText ? parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    const image = doc.querySelector('.pdp-main-image img')?.getAttribute('src');

    return { name: name || '', price, image_url: image || '' };
  },
  'but': (doc) => {
    const name = doc.querySelector('h1.product-title')?.textContent?.trim();
    const priceText = doc.querySelector('.product-price')?.textContent;
    const price = priceText ? parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    const image = doc.querySelector('.product-image img')?.getAttribute('src');

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

// Generic Open Graph / meta tag parser
function parseGenericMeta(doc: Document): Partial<ClippedProduct> {
  // Try Open Graph tags first
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const ogPrice = doc.querySelector('meta[property="og:price:amount"]')?.getAttribute('content') ||
                  doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content');

  // Fallback to standard meta tags
  const title = ogTitle ||
                doc.querySelector('meta[name="title"]')?.getAttribute('content') ||
                doc.querySelector('title')?.textContent?.trim();

  const description = ogDescription ||
                      doc.querySelector('meta[name="description"]')?.getAttribute('content');

  const image = ogImage ||
                doc.querySelector('meta[name="image"]')?.getAttribute('content');

  // Try to find price in various ways
  let price: number | null = null;

  if (ogPrice) {
    price = parseFloat(ogPrice.replace(',', '.'));
  } else {
    // Try JSON-LD structured data
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        const offers = data.offers || data['@graph']?.find((item: Record<string, unknown>) => item['@type'] === 'Offer');
        if (offers?.price) {
          price = parseFloat(String(offers.price).replace(',', '.'));
          break;
        }
      } catch {
        // Ignore parsing errors
      }
    }

    // Try price patterns in the HTML
    if (!price) {
      const html = doc.body?.innerHTML || '';
      for (const pattern of PRICE_PATTERNS) {
        const match = html.match(pattern);
        if (match && match[1]) {
          price = parseFloat(match[1].replace(',', '.'));
          break;
        }
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

// Fetch URL and parse product info (for use with a CORS proxy)
export async function fetchAndParseProduct(url: string): Promise<WebClipperResult> {
  try {
    // Use a CORS proxy for fetching
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return parseProductFromHtml(html, url);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de connexion',
    };
  }
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
