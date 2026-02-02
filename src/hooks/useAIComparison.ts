import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  Product,
  AIComparisonProductInput,
  AIComparisonProductResult,
  AIComparisonResult,
  ProductAIComparison
} from '@/types';
import { toast } from '@/hooks/useToast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface CreateComparisonParams {
  products: Product[];
  intendedUse: string;
  usageConditions: string;
}

interface AIComparisonAPIResponse {
  success: boolean;
  results: AIComparisonProductResult[];
  bestChoiceId: string;
  error?: string;
}

/**
 * Call the AI comparison Edge Function
 */
async function fetchAIComparison(
  params: CreateComparisonParams
): Promise<AIComparisonAPIResponse> {
  const productInputs: AIComparisonProductInput[] = params.products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description || '',
    pros: p.pros || '',
    cons: p.cons || '',
    category: p.category?.name
  }));

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-comparison`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      products: productInputs,
      intendedUse: params.intendedUse,
      usageConditions: params.usageConditions
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

/**
 * Save comparison results to the database
 * Note: Uses 'as any' because ai_comparisons tables are not in generated Supabase types yet
 */
async function saveComparisonToDatabase(
  intendedUse: string,
  usageConditions: string,
  results: AIComparisonProductResult[],
  bestChoiceId: string
): Promise<AIComparisonResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // Delete previous comparisons for these products (keep only latest)
  const productIds = results.map(r => r.productId);

  // Get existing comparison IDs for these products
  const { data: existingResults } = await (supabase as any)
    .from('ai_comparison_results')
    .select('comparison_id')
    .in('product_id', productIds);

  if (existingResults && existingResults.length > 0) {
    const comparisonIds = [...new Set(existingResults.map((r: any) => r.comparison_id))];
    await (supabase as any)
      .from('ai_comparisons')
      .delete()
      .in('id', comparisonIds)
      .eq('user_id', user.id);
  }

  // Create new comparison
  const { data: comparison, error: comparisonError } = await (supabase as any)
    .from('ai_comparisons')
    .insert({
      user_id: user.id,
      intended_use: intendedUse,
      usage_conditions: usageConditions,
      best_choice_id: bestChoiceId
    })
    .select()
    .single();

  if (comparisonError) throw comparisonError;

  // Create results
  const resultsToInsert = results.map(r => ({
    comparison_id: comparison.id,
    product_id: r.productId,
    adjusted_score: r.adjustedScore,
    justification: r.justification,
    is_best_choice: r.isBestChoice
  }));

  const { error: resultsError } = await (supabase as any)
    .from('ai_comparison_results')
    .insert(resultsToInsert);

  if (resultsError) throw resultsError;

  return {
    id: comparison.id,
    intendedUse,
    usageConditions,
    bestChoiceId,
    results,
    createdAt: comparison.created_at
  };
}

/**
 * Hook to create an AI comparison
 */
export function useCreateAIComparison() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateComparisonParams) => {
      // Call AI
      const aiResponse = await fetchAIComparison(params);

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'Erreur lors de l\'analyse IA');
      }

      // Save to database
      const result = await saveComparisonToDatabase(
        params.intendedUse,
        params.usageConditions,
        aiResponse.results,
        aiResponse.bestChoiceId
      );

      return result;
    },
    onSuccess: (data) => {
      // Invalidate queries for all products in this comparison
      data.results.forEach(r => {
        queryClient.invalidateQueries({ queryKey: ['product-ai-comparison', r.productId] });
      });

      // Invalidate existing comparison query for these products
      const productIds = data.results.map(r => r.productId).sort().join(',');
      queryClient.invalidateQueries({ queryKey: ['existing-ai-comparison', productIds] });
      queryClient.invalidateQueries({ queryKey: ['products-ai-comparison', productIds] });

      toast({
        title: 'Analyse terminée',
        description: 'Les résultats de la comparaison IA ont été enregistrés',
        variant: 'success'
      });
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
 * Hook to get the latest AI comparison for a product
 */
export function useProductAIComparison(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-ai-comparison', productId],
    queryFn: async (): Promise<ProductAIComparison | null> => {
      if (!productId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get the latest comparison result for this product
      const { data: result, error } = await (supabase as any)
        .from('ai_comparison_results')
        .select(`
          adjusted_score,
          justification,
          is_best_choice,
          comparison:ai_comparisons (
            id,
            intended_use,
            usage_conditions,
            best_choice_id,
            created_at
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false, referencedTable: 'ai_comparisons' })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching AI comparison:', error);
        return null;
      }

      if (!result || !result.comparison) return null;

      const comparison = Array.isArray(result.comparison)
        ? result.comparison[0]
        : result.comparison;

      return {
        comparisonId: comparison.id,
        intendedUse: comparison.intended_use,
        usageConditions: comparison.usage_conditions,
        adjustedScore: result.adjusted_score,
        justification: result.justification,
        isBestChoice: result.is_best_choice,
        bestChoiceId: comparison.best_choice_id,
        createdAt: comparison.created_at
      };
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get AI comparison results for multiple products (for comparison view)
 */
export function useProductsAIComparison(productIds: string[]) {
  return useQuery({
    queryKey: ['products-ai-comparison', productIds.sort().join(',')],
    queryFn: async (): Promise<Map<string, ProductAIComparison>> => {
      if (productIds.length === 0) return new Map();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Map();

      // Get all comparison results for these products
      const { data: results, error } = await (supabase as any)
        .from('ai_comparison_results')
        .select(`
          product_id,
          adjusted_score,
          justification,
          is_best_choice,
          comparison:ai_comparisons (
            id,
            intended_use,
            usage_conditions,
            best_choice_id,
            created_at
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false, referencedTable: 'ai_comparisons' });

      if (error) {
        console.error('Error fetching AI comparisons:', error);
        return new Map();
      }

      // Group by product_id and take the latest
      const resultMap = new Map<string, ProductAIComparison>();

      for (const result of results || []) {
        if (resultMap.has(result.product_id)) continue; // Already have latest

        const comparison = Array.isArray(result.comparison)
          ? result.comparison[0]
          : result.comparison;

        if (!comparison) continue;

        resultMap.set(result.product_id, {
          comparisonId: comparison.id,
          intendedUse: comparison.intended_use,
          usageConditions: comparison.usage_conditions,
          adjustedScore: result.adjusted_score,
          justification: result.justification,
          isBestChoice: result.is_best_choice,
          bestChoiceId: comparison.best_choice_id,
          createdAt: comparison.created_at
        });
      }

      return resultMap;
    },
    enabled: productIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to get an existing AI comparison for a specific set of products
 * Returns the comparison if all products were compared together, null otherwise
 */
export function useExistingAIComparisonForProducts(
  productIds: string[],
  products: Product[]
) {
  return useQuery({
    queryKey: ['existing-ai-comparison', productIds.sort().join(',')],
    queryFn: async (): Promise<AIComparisonResult | null> => {
      if (productIds.length < 2) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get all comparison results for these products
      const { data: results, error } = await (supabase as any)
        .from('ai_comparison_results')
        .select(`
          product_id,
          adjusted_score,
          justification,
          is_best_choice,
          comparison:ai_comparisons (
            id,
            intended_use,
            usage_conditions,
            best_choice_id,
            created_at
          )
        `)
        .in('product_id', productIds);

      if (error) {
        console.error('Error fetching existing AI comparison:', error);
        return null;
      }

      if (!results || results.length === 0) return null;

      // Group results by comparison_id
      const comparisonGroups = new Map<string, any[]>();

      for (const result of results) {
        const comparison = Array.isArray(result.comparison)
          ? result.comparison[0]
          : result.comparison;

        if (!comparison) continue;

        const comparisonId = comparison.id;
        if (!comparisonGroups.has(comparisonId)) {
          comparisonGroups.set(comparisonId, []);
        }
        comparisonGroups.get(comparisonId)!.push({ ...result, comparison });
      }

      // Find a comparison that has exactly all the selected products
      for (const [comparisonId, groupResults] of comparisonGroups) {
        const groupProductIds = new Set(groupResults.map(r => r.product_id));
        const selectedProductIds = new Set(productIds);

        // Check if this comparison has exactly the same products
        if (groupProductIds.size === selectedProductIds.size &&
            [...selectedProductIds].every(id => groupProductIds.has(id))) {
          // Found a matching comparison
          const firstResult = groupResults[0];
          const comparison = firstResult.comparison;

          // Build the AIComparisonResult
          const aiResults: AIComparisonProductResult[] = groupResults.map(r => {
            const product = products.find(p => p.id === r.product_id);
            return {
              productId: r.product_id,
              productName: product?.name || 'Produit inconnu',
              adjustedScore: r.adjusted_score,
              justification: r.justification,
              isBestChoice: r.is_best_choice
            };
          });

          return {
            id: comparisonId,
            intendedUse: comparison.intended_use,
            usageConditions: comparison.usage_conditions,
            bestChoiceId: comparison.best_choice_id,
            results: aiResults,
            createdAt: comparison.created_at
          };
        }
      }

      return null;
    },
    enabled: productIds.length >= 2 && products.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
