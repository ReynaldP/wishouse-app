import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Product, Recommendation, RecommendationResponse } from '@/types';
import { toast } from '@/hooks/useToast';

interface FetchRecommendationsParams {
  productName: string;
  productDescription?: string;
  category?: string;
  maxPrice?: number;
  currentPrice?: number;
}

/**
 * Fetch AI recommendations for a product
 */
async function fetchRecommendations(
  params: FetchRecommendationsParams
): Promise<RecommendationResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-recommendations', {
      body: params
    });

    if (error) {
      throw new Error(error.message || 'Failed to fetch recommendations');
    }

    return data as RecommendationResponse;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return {
      success: false,
      recommendations: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Hook to get AI recommendations for a product
 */
export function useAIRecommendations(product: Product | null, enabled = false) {
  return useQuery({
    queryKey: ['recommendations', product?.id],
    queryFn: async () => {
      if (!product) {
        return { success: false, recommendations: [], error: 'No product provided' };
      }

      return fetchRecommendations({
        productName: product.name,
        productDescription: product.description || undefined,
        category: product.category?.name,
        currentPrice: product.price,
        maxPrice: product.price * 1.2 // Allow 20% over current price
      });
    },
    enabled: enabled && !!product,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    retry: 1
  });
}

/**
 * Mutation to manually fetch recommendations
 */
export function useFetchRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      return fetchRecommendations({
        productName: product.name,
        productDescription: product.description || undefined,
        category: product.category?.name,
        currentPrice: product.price,
        maxPrice: product.price * 1.2
      });
    },
    onSuccess: (data, product) => {
      // Update the cache
      queryClient.setQueryData(['recommendations', product.id], data);

      if (data.success && data.recommendations.length > 0) {
        toast({
          title: 'Alternatives trouvées',
          description: `${data.recommendations.length} alternatives disponibles`,
          variant: 'success'
        });
      } else if (!data.success) {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible de trouver des alternatives',
          variant: 'destructive'
        });
      }
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
 * Hook to convert a recommendation to a product
 */
export function useAddRecommendationAsProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recommendation: Recommendation) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: recommendation.name,
          price: recommendation.price,
          link: recommendation.link,
          image_url: recommendation.image_url,
          description: `Source: ${recommendation.source}\n${recommendation.ai_reason}`,
          status: 'pending',
          priority: 'medium'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
      toast({
        title: 'Produit ajouté',
        description: 'L\'alternative a été ajoutée à votre liste',
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
