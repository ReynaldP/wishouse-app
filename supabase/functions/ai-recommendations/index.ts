import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  productName: string;
  productDescription?: string;
  category?: string;
  maxPrice?: number;
  currentPrice?: number;
}

interface Recommendation {
  name: string;
  price: number;
  image_url: string;
  link: string;
  source: string;
  relevance_score: number;
  ai_reason: string;
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  price?: number;
  source?: string;
}

// Sites e-commerce supportés avec leurs patterns de détection
const ECOMMERCE_SITES: Record<string, { name: string; key: string; pricePattern?: RegExp }> = {
  'amazon.fr': { name: 'Amazon', key: 'amazon' },
  'ikea.com': { name: 'IKEA', key: 'ikea' },
  'leroymerlin.fr': { name: 'Leroy Merlin', key: 'leroymerlin' },
  'cdiscount.com': { name: 'Cdiscount', key: 'cdiscount' },
  'fnac.com': { name: 'Fnac', key: 'fnac' },
  'boulanger.com': { name: 'Boulanger', key: 'boulanger' },
  'conforama.fr': { name: 'Conforama', key: 'conforama' },
  'but.fr': { name: 'But', key: 'but' },
  'manomano.fr': { name: 'ManoMano', key: 'manomano' },
  'darty.com': { name: 'Darty', key: 'darty' },
  'castorama.fr': { name: 'Castorama', key: 'castorama' },
  'maisonsdumonde.com': { name: 'Maisons du Monde', key: 'maisonsdumonde' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const { productName, productDescription, category, maxPrice, currentPrice } =
      await req.json() as RecommendationRequest;

    if (!productName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product name is required', recommendations: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Build optimized search query
    const searchQuery = buildSearchQuery(productName, category, maxPrice);
    console.log('Search query:', searchQuery);

    // Step 2: Search for real products using DuckDuckGo
    const searchResults = await searchProducts(searchQuery);
    console.log('Found', searchResults.length, 'search results');

    if (searchResults.length === 0) {
      // Fallback: try with simpler query
      const simpleQuery = productName.split(' ').slice(0, 3).join(' ');
      const fallbackResults = await searchProducts(simpleQuery + ' acheter');
      searchResults.push(...fallbackResults);
    }

    // Step 3: Use AI to analyze and score the results
    const recommendations = await analyzeWithAI(
      anthropicApiKey,
      searchResults,
      productName,
      productDescription,
      category,
      currentPrice,
      maxPrice
    );

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        searchQuery
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        recommendations: []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSearchQuery(productName: string, category?: string, maxPrice?: number): string {
  // Clean product name
  const cleanName = productName
    .replace(/[^\w\s\u00C0-\u017F-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let query = cleanName;

  // Add category if relevant
  if (category && !cleanName.toLowerCase().includes(category.toLowerCase())) {
    query += ` ${category}`;
  }

  // Add price context for better results
  if (maxPrice) {
    query += ` moins de ${maxPrice}€`;
  }

  // Add "acheter" to get shopping results
  query += ' acheter prix';

  return query;
}

async function searchProducts(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    // Use DuckDuckGo HTML search (more reliable than API)
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      console.error('DuckDuckGo search failed:', response.status);
      return results;
    }

    const html = await response.text();

    // Parse results from HTML
    const resultMatches = html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g);
    const snippetMatches = html.matchAll(/<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/g);

    const links: string[] = [];
    const titles: string[] = [];
    const snippets: string[] = [];

    for (const match of resultMatches) {
      // Decode DuckDuckGo redirect URL
      let url = match[1];
      if (url.includes('uddg=')) {
        const decoded = decodeURIComponent(url.split('uddg=')[1]?.split('&')[0] || '');
        url = decoded || url;
      }
      links.push(url);
      titles.push(match[2].trim());
    }

    for (const match of snippetMatches) {
      snippets.push(match[1].replace(/<[^>]*>/g, '').trim());
    }

    // Filter for e-commerce sites only
    for (let i = 0; i < Math.min(links.length, 20); i++) {
      const link = links[i];
      const title = titles[i] || '';
      const snippet = snippets[i] || '';

      // Check if it's an e-commerce site
      const siteInfo = detectEcommerceSite(link);
      if (siteInfo) {
        // Try to extract price from snippet
        const price = extractPrice(snippet) || extractPrice(title);

        results.push({
          title: cleanTitle(title),
          link,
          snippet,
          price: price || undefined,
          source: siteInfo.key,
        });
      }
    }

    // Also try Google Shopping results via alternative search
    const shoppingResults = await searchGoogleShopping(query);
    results.push(...shoppingResults);

  } catch (error) {
    console.error('Search error:', error);
  }

  // Deduplicate by link
  const seen = new Set<string>();
  return results.filter(r => {
    if (seen.has(r.link)) return false;
    seen.add(r.link);
    return true;
  }).slice(0, 15);
}

async function searchGoogleShopping(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    // Use SerpAPI-like approach with public endpoint
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop&hl=fr&gl=fr`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });

    if (!response.ok) return results;

    const html = await response.text();

    // Extract product links and prices from shopping results
    // Pattern for shopping result items
    const productPattern = /<a[^>]*href="(\/url\?[^"]*|https?:\/\/[^"]*)"[^>]*>.*?<\/a>/gs;
    const matches = html.matchAll(productPattern);

    for (const match of matches) {
      let url = match[1];

      // Decode Google redirect URL
      if (url.startsWith('/url?')) {
        const urlMatch = url.match(/[?&]q=([^&]*)/);
        if (urlMatch) {
          url = decodeURIComponent(urlMatch[1]);
        }
      }

      const siteInfo = detectEcommerceSite(url);
      if (siteInfo && !results.some(r => r.link === url)) {
        // Extract surrounding text for title/price
        const context = match[0];
        const priceMatch = context.match(/(\d+[,.]?\d*)\s*€/);

        results.push({
          title: extractTitleFromUrl(url),
          link: url,
          snippet: '',
          price: priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : undefined,
          source: siteInfo.key,
        });
      }
    }
  } catch (error) {
    console.error('Google Shopping search error:', error);
  }

  return results.slice(0, 10);
}

function detectEcommerceSite(url: string): { name: string; key: string } | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const [domain, info] of Object.entries(ECOMMERCE_SITES)) {
      if (hostname.includes(domain)) {
        return info;
      }
    }
  } catch {
    // Invalid URL
  }
  return null;
}

function extractPrice(text: string): number | null {
  if (!text) return null;

  // Match various price formats: 299€, 299,99€, 299.99 €, EUR 299, etc.
  const patterns = [
    /(\d+[.,]\d{2})\s*€/,
    /(\d+)\s*€/,
    /€\s*(\d+[.,]?\d*)/,
    /EUR\s*(\d+[.,]?\d*)/i,
    /prix[:\s]*(\d+[.,]?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
  }

  return null;
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-|]\s*(Amazon|IKEA|Leroy Merlin|Cdiscount|Fnac|Boulanger|Conforama|But|ManoMano|Darty|Castorama).*$/i, '')
    .replace(/\s*\|\s*.*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

function extractTitleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    // Extract product name from URL path
    const segments = pathname.split('/').filter(s => s.length > 3);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      return lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\.\w+$/, '')
        .replace(/\d{5,}/g, '')
        .trim()
        .slice(0, 80);
    }
  } catch {
    // Invalid URL
  }
  return 'Produit';
}

async function analyzeWithAI(
  apiKey: string,
  searchResults: SearchResult[],
  productName: string,
  productDescription?: string,
  category?: string,
  currentPrice?: number,
  maxPrice?: number
): Promise<Recommendation[]> {
  if (searchResults.length === 0) {
    return [];
  }

  const prompt = `Tu es un assistant d'achat expert. L'utilisateur recherche des alternatives à ce produit :

**Produit recherché :** ${productName}
${productDescription ? `**Description :** ${productDescription}` : ''}
${category ? `**Catégorie :** ${category}` : ''}
${currentPrice ? `**Prix actuel :** ${currentPrice}€` : ''}
${maxPrice ? `**Budget max :** ${maxPrice}€` : ''}

Voici les résultats de recherche trouvés sur les sites e-commerce français :

${searchResults.map((r, i) => `
${i + 1}. **${r.title}**
   - Lien : ${r.link}
   - Site : ${r.source || 'inconnu'}
   ${r.price ? `- Prix trouvé : ${r.price}€` : '- Prix : non disponible'}
   ${r.snippet ? `- Description : ${r.snippet.slice(0, 150)}...` : ''}
`).join('\n')}

**Ta mission :**
1. Analyse chaque résultat et évalue s'il s'agit d'une vraie alternative pertinente au produit recherché
2. Attribue un score de pertinence (0-100) basé sur la similarité avec le produit original
3. Si le prix n'est pas disponible, estime-le de façon réaliste
4. Explique brièvement pourquoi c'est une bonne alternative

Réponds UNIQUEMENT avec un JSON valide :
{
  "recommendations": [
    {
      "index": 1,
      "name": "Nom du produit (reformulé si nécessaire)",
      "price": 199.99,
      "relevance_score": 85,
      "ai_reason": "Explication courte de pourquoi c'est une bonne alternative"
    }
  ]
}

Règles :
- Inclus UNIQUEMENT les résultats pertinents (score >= 50)
- Maximum 6 recommandations
- Ordonne par pertinence décroissante
- Vérifie que c'est bien un produit (pas une page de catégorie ou article de blog)
- Le "index" correspond au numéro du résultat dans la liste ci-dessus
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const message = await response.json();
    const textContent = message.content?.find((c: { type: string }) => c.type === 'text');

    if (!textContent) {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);
    const recommendations: Recommendation[] = [];

    for (const rec of aiResponse.recommendations || []) {
      const originalResult = searchResults[rec.index - 1];
      if (!originalResult) continue;

      recommendations.push({
        name: rec.name || originalResult.title,
        price: rec.price || originalResult.price || 0,
        image_url: '', // Will be empty - no reliable way to get images without scraping
        link: originalResult.link,
        source: originalResult.source || 'unknown',
        relevance_score: rec.relevance_score || 50,
        ai_reason: rec.ai_reason || 'Alternative similaire trouvée'
      });
    }

    return recommendations.slice(0, 6);

  } catch (error) {
    console.error('AI analysis error:', error);

    // Fallback: return raw results without AI analysis
    return searchResults.slice(0, 5).map(r => ({
      name: r.title,
      price: r.price || 0,
      image_url: '',
      link: r.link,
      source: r.source || 'unknown',
      relevance_score: 60,
      ai_reason: 'Alternative trouvée sur ' + (ECOMMERCE_SITES[r.source || '']?.name || r.source)
    }));
  }
}
