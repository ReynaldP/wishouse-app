import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Settings, SettingsUpdate } from '@/types';
import { toast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/useAuthStore';

export function useSettings() {
  const user = useAuthStore(state => state.user);

  return useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: createError } = await supabase
            .from('settings')
            .insert({
              user_id: user.id,
              total_budget: 10000,
              currency: 'EUR',
              dark_mode: true
            })
            .select()
            .single();

          if (createError) throw createError;
          return newSettings as Settings;
        }
        throw error;
      }

      return data as Settings;
    },
    enabled: !!user
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async (updates: SettingsUpdate) => {
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
      toast({
        title: 'Paramètres enregistrés',
        description: 'Vos préférences ont été mises à jour',
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
