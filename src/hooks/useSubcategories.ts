import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Subcategory, SubcategoryInsert, SubcategoryUpdate } from '@/types';
import { toast } from '@/hooks/useToast';

export function useSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('subcategories')
        .select('*')
        .order('order_index', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Subcategory[];
    }
  });
}

export function useSubcategory(id: string | null) {
  return useQuery({
    queryKey: ['subcategory', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Subcategory;
    },
    enabled: !!id
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subcategory: SubcategoryInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get max order_index for this category
      const { data: existing } = await supabase
        .from('subcategories')
        .select('order_index')
        .eq('category_id', subcategory.category_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existing && existing.length > 0
        ? (existing[0].order_index || 0) + 1
        : 0;

      const { data, error } = await supabase
        .from('subcategories')
        .insert({
          ...subcategory,
          user_id: user.id,
          order_index: subcategory.order_index ?? nextOrderIndex
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast({
        title: 'Sous-catégorie créée',
        description: 'La sous-catégorie a été ajoutée avec succès',
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

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SubcategoryUpdate }) => {
      const { data, error } = await supabase
        .from('subcategories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Sous-catégorie modifiée',
        description: 'Les modifications ont été enregistrées',
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

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Update products to remove subcategory reference
      await supabase
        .from('products')
        .update({ subcategory_id: null })
        .eq('subcategory_id', id);

      // Delete subcategory
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Sous-catégorie supprimée',
        description: 'La sous-catégorie a été supprimée définitivement',
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
