import { useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/useToast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface GenerateProsConsParams {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  link?: string;
}

interface GenerateProsConsResponse {
  success: boolean;
  pros?: string;
  cons?: string;
  error?: string;
}

async function fetchProsCons(params: GenerateProsConsParams): Promise<GenerateProsConsResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-pros-cons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

/**
 * Hook to generate pros and cons using AI
 */
export function useGenerateProsCons() {
  return useMutation({
    mutationFn: async (params: GenerateProsConsParams) => {
      const response = await fetchProsCons(params);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la génération');
      }

      return {
        pros: response.pros || '',
        cons: response.cons || ''
      };
    },
    onSuccess: () => {
      toast({
        title: 'Génération terminée',
        description: 'Les avantages et inconvénients ont été générés par l\'IA',
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
