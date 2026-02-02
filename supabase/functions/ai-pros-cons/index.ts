import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProsConsRequest {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  link?: string;
}

interface ProsConsResponse {
  success: boolean;
  pros?: string;
  cons?: string;
  error?: string;
}

interface ScrapedData {
  description?: string;
  reviews?: string[];
  specs?: string[];
  rating?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const { name, description, price, category, link } = await req.json() as ProsConsRequest;

    if (!name || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product name is required' } as ProsConsResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape additional data from URL if provided
    let scrapedData: ScrapedData = {};
    if (link) {
      scrapedData = await scrapeProductPage(link);
    }

    // Search for reviews online if no link or scraping failed
    let webSearchResults = '';
    if (!link || (scrapedData.reviews?.length === 0 && !scrapedData.description)) {
      webSearchResults = await searchProductReviews(name);
    }

    // Build the prompt with all gathered information
    const prompt = buildPrompt(name, description, price, category, link, scrapedData, webSearchResults);

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', JSON.stringify(errorData));
      throw new Error(errorData.error?.message || `Anthropic API error: ${response.status}`);
    }

    const message = await response.json();

    // Extract the text content
    const textContent = message.content?.find((c: { type: string }) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        success: true,
        pros: aiResponse.pros || '',
        cons: aiResponse.cons || ''
      } as ProsConsResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      } as ProsConsResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Scrape product page for reviews and additional info
 */
async function scrapeProductPage(url: string): Promise<ScrapedData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      console.log(`Failed to fetch ${url}: ${response.status}`);
      return {};
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) return {};

    const data: ScrapedData = {
      reviews: [],
      specs: [],
    };

    // Detect site and use appropriate selectors
    const hostname = new URL(url).hostname.toLowerCase();

    // Common review selectors for various sites
    const reviewSelectors = [
      // Amazon
      '[data-hook="review-body"]',
      '.review-text-content',
      '.a-expander-content.review-text-content',
      // Generic
      '.review-content',
      '.review-text',
      '.customer-review',
      '.user-review',
      '[class*="review"] p',
      '[class*="avis"] p',
      '.comment-content',
      '.testimonial-text',
      // French sites
      '.bv-content-summary-body-text',
      '.pr-rd-description-text',
      '.review-body',
    ];

    // Extract reviews
    for (const selector of reviewSelectors) {
      const elements = doc.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach((el: Element) => {
          const text = el.textContent?.trim();
          if (text && text.length > 20 && text.length < 1000) {
            data.reviews!.push(text);
          }
        });
        if (data.reviews!.length >= 5) break;
      }
    }

    // Extract rating
    const ratingSelectors = [
      '[data-hook="average-star-rating"]',
      '.average-rating',
      '[class*="rating"] [class*="value"]',
      '.star-rating',
      '[itemprop="ratingValue"]',
    ];

    for (const selector of ratingSelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        const text = el.textContent?.trim();
        if (text) {
          data.rating = text;
          break;
        }
      }
    }

    // Extract product description if more detailed than provided
    const descSelectors = [
      '#productDescription',
      '[data-feature-name="productDescription"]',
      '.product-description',
      '[class*="description"]',
      '#feature-bullets',
      '.product-features',
    ];

    for (const selector of descSelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        const text = el.textContent?.trim();
        if (text && text.length > 50) {
          data.description = text.substring(0, 2000);
          break;
        }
      }
    }

    // Extract specs/features
    const specSelectors = [
      '.product-facts li',
      '.tech-specs li',
      '#productDetails_techSpec_section_1 tr',
      '.specification-row',
      '[class*="spec"] li',
      '.feature-list li',
    ];

    for (const selector of specSelectors) {
      const elements = doc.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach((el: Element) => {
          const text = el.textContent?.trim().replace(/\s+/g, ' ');
          if (text && text.length > 5 && text.length < 200) {
            data.specs!.push(text);
          }
        });
        if (data.specs!.length >= 10) break;
      }
    }

    // Limit data
    data.reviews = data.reviews!.slice(0, 5);
    data.specs = data.specs!.slice(0, 10);

    console.log(`Scraped from ${hostname}: ${data.reviews?.length} reviews, ${data.specs?.length} specs`);
    return data;

  } catch (error) {
    console.error('Scraping error:', error);
    return {};
  }
}

/**
 * Search for product reviews using DuckDuckGo
 */
async function searchProductReviews(productName: string): Promise<string> {
  try {
    const query = encodeURIComponent(`${productName} avis test review`);
    const url = `https://html.duckduckgo.com/html/?q=${query}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return '';
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) return '';

    // Extract search result snippets
    const results: string[] = [];
    const snippets = doc.querySelectorAll('.result__snippet');

    snippets.forEach((el: Element) => {
      const text = el.textContent?.trim();
      if (text && text.length > 30) {
        results.push(text);
      }
    });

    const limitedResults = results.slice(0, 5).join('\n\n');
    console.log(`Web search found ${results.length} results for: ${productName}`);

    return limitedResults;

  } catch (error) {
    console.error('Web search error:', error);
    return '';
  }
}

function buildPrompt(
  name: string,
  description?: string,
  price?: number,
  category?: string,
  link?: string,
  scrapedData?: ScrapedData,
  webSearchResults?: string
): string {
  let productInfo = `**Nom du produit:** ${name}`;

  if (price) {
    productInfo += `\n**Prix:** ${price}€`;
  }

  if (category) {
    productInfo += `\n**Catégorie:** ${category}`;
  }

  if (description) {
    productInfo += `\n**Description fournie:** ${description}`;
  }

  if (link) {
    try {
      const domain = new URL(link).hostname.replace('www.', '');
      productInfo += `\n**Source:** ${domain}`;
    } catch {
      // Ignore invalid URLs
    }
  }

  // Add scraped data
  if (scrapedData?.description) {
    productInfo += `\n\n**Description détaillée extraite du site:**\n${scrapedData.description.substring(0, 1000)}`;
  }

  if (scrapedData?.rating) {
    productInfo += `\n**Note moyenne:** ${scrapedData.rating}`;
  }

  if (scrapedData?.specs && scrapedData.specs.length > 0) {
    productInfo += `\n\n**Caractéristiques techniques:**\n${scrapedData.specs.slice(0, 8).map(s => `- ${s}`).join('\n')}`;
  }

  if (scrapedData?.reviews && scrapedData.reviews.length > 0) {
    productInfo += `\n\n**Avis clients extraits:**\n${scrapedData.reviews.map((r, i) => `${i + 1}. "${r.substring(0, 300)}${r.length > 300 ? '...' : ''}"`).join('\n')}`;
  }

  // Add web search results
  if (webSearchResults) {
    productInfo += `\n\n**Résultats de recherche web (avis et tests):**\n${webSearchResults}`;
  }

  return `Tu es un expert en conseil d'achat avec accès à des données réelles sur ce produit. Analyse TOUTES les informations fournies (description, caractéristiques, avis clients, résultats de recherche) pour générer des avantages et inconvénients précis et factuels.

## Informations sur le produit

${productInfo}

## Ta mission

En te basant sur TOUTES les données ci-dessus (particulièrement les avis clients et caractéristiques techniques), génère:

**Points positifs (pros):**
- Identifie les vrais avantages mentionnés dans les avis
- Mets en avant les caractéristiques techniques positives
- Sois spécifique à CE produit (pas générique)

**Points négatifs (cons):**
- Identifie les vrais inconvénients mentionnés dans les avis
- Note les limitations techniques
- Mentionne les problèmes récurrents si présents dans les avis

Format:
- 3 à 5 points pour chaque catégorie
- Concis mais informatifs (une ligne par point)
- En français
- Liste à puces avec des tirets (-)
- Si le prix est indiqué, mentionne le rapport qualité/prix

Réponds UNIQUEMENT avec un objet JSON valide:
{
  "pros": "- Premier avantage\\n- Deuxième avantage\\n- Troisième avantage",
  "cons": "- Premier inconvénient\\n- Deuxième inconvénient\\n- Troisième inconvénient"
}

Règles importantes:
- BASE-TOI sur les avis clients réels si disponibles
- Sois factuel et spécifique, pas générique
- Si des avis sont fournis, extrais les points récurrents
- Utilise \\n pour les retours à la ligne
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;
}
