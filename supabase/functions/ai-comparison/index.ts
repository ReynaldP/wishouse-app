import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductInput {
  id: string;
  name: string;
  price: number;
  description: string;
  pros: string;
  cons: string;
  category?: string;
}

interface ComparisonRequest {
  products: ProductInput[];
  intendedUse: string;
  usageConditions: string;
}

interface ProductResult {
  productId: string;
  productName: string;
  adjustedScore: number;
  justification: string;
  isBestChoice: boolean;
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

    const { products, intendedUse, usageConditions } = await req.json() as ComparisonRequest;

    if (!products || products.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least 2 products are required', results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!intendedUse || !usageConditions) {
      return new Response(
        JSON.stringify({ success: false, error: 'Intended use and usage conditions are required', results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt
    const prompt = buildPrompt(products, intendedUse, usageConditions);

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
        max_tokens: 4096,
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
    const results: ProductResult[] = aiResponse.results || [];
    const bestChoiceId = aiResponse.bestChoiceId || results.find(r => r.isBestChoice)?.productId;

    return new Response(
      JSON.stringify({
        success: true,
        results,
        bestChoiceId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        results: []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildPrompt(
  products: ProductInput[],
  intendedUse: string,
  usageConditions: string
): string {
  const productsDescription = products.map((p, index) => `
Produit ${index + 1}:
- ID: ${p.id}
- Nom: ${p.name}
- Prix: ${p.price}€
- Description: ${p.description || 'Non spécifiée'}
- Catégorie: ${p.category || 'Non spécifiée'}
- Points positifs: ${p.pros || 'Non spécifiés'}
- Points négatifs: ${p.cons || 'Non spécifiés'}
`).join('\n');

  return `Tu es un expert en conseil d'achat. L'utilisateur compare plusieurs produits et a besoin de ton aide pour choisir le meilleur selon son cas d'utilisation spécifique.

## Contexte de l'utilisateur

**Utilisation prévue:** ${intendedUse}

**Conditions d'utilisation:** ${usageConditions}

## Produits à comparer

${productsDescription}

## Ta mission

Analyse chaque produit en fonction du contexte d'utilisation de l'utilisateur et fournis:
1. Une note ajustée de 0 à 100 pour chaque produit (basée sur l'adéquation avec l'utilisation prévue)
2. Une justification détaillée (2-3 phrases) pour chaque note
3. Le meilleur choix final

Réponds UNIQUEMENT avec un objet JSON valide dans ce format exact:
{
  "results": [
    {
      "productId": "id-du-produit",
      "productName": "Nom du produit",
      "adjustedScore": 85,
      "justification": "Explication détaillée de pourquoi ce produit a cette note pour l'utilisation prévue...",
      "isBestChoice": false
    }
  ],
  "bestChoiceId": "id-du-meilleur-produit"
}

Règles importantes:
- Les scores doivent être réalistes et différenciés entre les produits
- La justification doit être spécifique au contexte d'utilisation de l'utilisateur
- Un seul produit peut avoir isBestChoice: true
- Le bestChoiceId doit correspondre au produit avec isBestChoice: true
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;
}
