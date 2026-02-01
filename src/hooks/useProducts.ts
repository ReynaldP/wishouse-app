import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Product, ProductFilters, ProductInsert, ProductUpdate } from '@/types';
import { toast } from '@/hooks/useToast';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          subcategory:subcategories(*),
          product_tags(tag:tags(*))
        `)
        .order('created_at', { ascending: false });

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters?.subcategory_id) {
        query = query.eq('subcategory_id', filters.subcategory_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.is_favorite !== undefined) {
        query = query.eq('is_favorite', filters.is_favorite);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform product_tags to tags array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let products = ((data || []) as any[]).map(product => ({
        ...product,
        tags: product.product_tags
          ?.map((pt: { tag: unknown }) => pt.tag)
          .filter(Boolean) || []
      })) as Product[];

      // Filter by tag_id (client-side filtering since tags are in a join table)
      if (filters?.tag_id) {
        products = products.filter(product =>
          product.tags?.some(tag => tag.id === filters.tag_id)
        );
      }

      return products;
    }
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          subcategory:subcategories(*),
          product_tags(tag:tags(*))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productData = data as any;
      return {
        ...productData,
        tags: productData.product_tags
          ?.map((pt: { tag: unknown }) => pt.tag)
          .filter(Boolean) || []
      } as Product;
    },
    enabled: !!id
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { tag_ids, ...productData } = product;

      const { data, error } = await supabase
        .from('products')
        .insert({ ...productData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Insert tags if provided
      if (tag_ids && tag_ids.length > 0) {
        const tagInserts = tag_ids.map(tagId => ({
          product_id: data.id,
          tag_id: tagId
        }));

        await supabase.from('product_tags').insert(tagInserts);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
      toast({
        title: 'Produit créé',
        description: 'Le produit a été ajouté avec succès',
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

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProductUpdate }) => {
      const { tag_ids, ...productData } = updates;

      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update tags if provided
      if (tag_ids !== undefined) {
        await supabase.from('product_tags').delete().eq('product_id', id);

        if (tag_ids.length > 0) {
          const tagInserts = tag_ids.map(tagId => ({
            product_id: id,
            tag_id: tagId
          }));
          await supabase.from('product_tags').insert(tagInserts);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
      toast({
        title: 'Produit modifié',
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

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete product_tags
      await supabase.from('product_tags').delete().eq('product_id', id);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
      toast({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé définitivement',
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

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: product } = await supabase
        .from('products')
        .select('is_favorite')
        .eq('id', id)
        .single();

      if (!product) throw new Error('Produit introuvable');

      const { data, error } = await supabase
        .from('products')
        .update({ is_favorite: !product.is_favorite })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    }
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Product['status'] }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['budget-stats'] });
    }
  });
}
