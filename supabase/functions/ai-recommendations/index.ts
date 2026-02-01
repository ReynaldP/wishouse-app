import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.1';

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

    const { productName, productDescription, category, maxPrice, currentPrice } =
      await req.json() as RecommendationRequest;

    if (!productName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Build the prompt
    const prompt = buildPrompt(productName, productDescription, category, maxPrice, currentPrice);

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract the text content
    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);
    const recommendations: Recommendation[] = aiResponse.recommendations || [];

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        searchQuery: aiResponse.searchQuery || productName
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(
  productName: string,
  productDescription?: string,
  category?: string,
  maxPrice?: number,
  currentPrice?: number
): string {
  return `Tu es un assistant d'achat intelligent spécialisé dans les produits pour la maison en France.

L'utilisateur recherche des alternatives pour ce produit :
- Nom : ${productName}
${productDescription ? `- Description : ${productDescription}` : ''}
${category ? `- Catégorie : ${category}` : ''}
${currentPrice ? `- Prix actuel : ${currentPrice}€` : ''}
${maxPrice ? `- Budget maximum : ${maxPrice}€` : ''}

Ta mission :
1. Analyse le produit décrit
2. Suggère 5 alternatives similaires disponibles sur les principaux sites e-commerce français (Amazon.fr, IKEA, Leroy Merlin, Cdiscount, Fnac, Boulanger, Conforama, But)
3. Pour chaque alternative, estime un prix réaliste basé sur tes connaissances du marché français

Réponds UNIQUEMENT avec un objet JSON valide dans ce format exact :
{
  "searchQuery": "mots-clés optimaux pour rechercher ce type de produit",
  "recommendations": [
    {
      "name": "Nom du produit alternatif",
      "price": 299.99,
      "source": "amazon",
      "relevance_score": 85,
      "ai_reason": "Explication courte de pourquoi cette alternative est pertinente"
    }
  ]
}

Règles importantes :
- Inclus exactement 5 recommandations
- Le score de pertinence est entre 0 et 100
- Les prix doivent être réalistes pour le marché français
- Les sources doivent être parmi : amazon, ikea, leroymerlin, cdiscount, fnac, boulanger, conforama, but
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;
}
