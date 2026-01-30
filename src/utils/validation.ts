import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  price: z.number().min(0, 'Le prix doit être positif'),
  category_id: z.string().nullable(),
  subcategory_id: z.string().nullable(),
  link: z.string().url('URL invalide').or(z.literal('')),
  description: z.string().max(2000, 'La description est trop longue'),
  status: z.enum(['pending', 'to_buy', 'purchased']),
  priority: z.enum(['low', 'medium', 'high']),
  image_url: z.string().url('URL invalide').or(z.literal('')),
  planned_date: z.string().nullable(),
  is_favorite: z.boolean(),
  pros: z.string().max(1000, 'Texte trop long'),
  cons: z.string().max(1000, 'Texte trop long'),
  tag_ids: z.array(z.string()).optional()
});

export type ProductFormData = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  icon: z.string().min(1, 'L\'icône est requise'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide'),
  budget: z.number().min(0, 'Le budget doit être positif'),
  order_index: z.number().int().min(0)
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const subcategorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  category_id: z.string().min(1, 'La catégorie est requise'),
  budget: z.number().min(0, 'Le budget doit être positif'),
  order_index: z.number().int().min(0)
});

export type SubcategoryFormData = z.infer<typeof subcategorySchema>;

export const tagSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50, 'Le nom est trop long'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide')
});

export type TagFormData = z.infer<typeof tagSchema>;

export const settingsSchema = z.object({
  total_budget: z.number().min(0, 'Le budget doit être positif'),
  currency: z.string().min(3).max(3),
  dark_mode: z.boolean()
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères')
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
});

export type RegisterFormData = z.infer<typeof registerSchema>;
