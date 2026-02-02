import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

    // Build the prompt
    const prompt = buildPrompt(name, description, price, category, link);

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
        max_tokens: 1024,
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

function buildPrompt(
  name: string,
  description?: string,
  price?: number,
  category?: string,
  link?: string
): string {
  let productInfo = `Nom du produit: ${name}`;

  if (price) {
    productInfo += `\nPrix: ${price}€`;
  }

  if (category) {
    productInfo += `\nCatégorie: ${category}`;
  }

  if (description) {
    productInfo += `\nDescription: ${description}`;
  }

  if (link) {
    // Extract domain for context
    try {
      const domain = new URL(link).hostname.replace('www.', '');
      productInfo += `\nSource: ${domain}`;
    } catch {
      // Ignore invalid URLs
    }
  }

  return `Tu es un expert en conseil d'achat. Analyse ce produit et génère une liste d'avantages (pros) et d'inconvénients (cons) pertinents et réalistes.

## Informations sur le produit

${productInfo}

## Ta mission

Génère des avantages et inconvénients:
- Concis mais informatifs (chaque point en une ligne)
- Réalistes et basés sur le type de produit
- 3 à 5 points pour chaque catégorie
- En français
- Format: liste à puces avec des tirets (-)

Réponds UNIQUEMENT avec un objet JSON valide dans ce format exact:
{
  "pros": "- Premier avantage\\n- Deuxième avantage\\n- Troisième avantage",
  "cons": "- Premier inconvénient\\n- Deuxième inconvénient\\n- Troisième inconvénient"
}

Règles importantes:
- Sois objectif et équilibré
- Base-toi sur les caractéristiques typiques de ce type de produit
- Si le prix est indiqué, mentionne le rapport qualité/prix
- Utilise \\n pour les retours à la ligne dans le JSON
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après`;
}
