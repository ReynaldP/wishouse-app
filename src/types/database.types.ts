import type { Category, Subcategory, Product, Tag, ProductTag, Settings } from './index';

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'user_id'>>;
      };
      subcategories: {
        Row: Subcategory;
        Insert: Omit<Subcategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subcategory, 'id' | 'user_id'>>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'subcategory' | 'tags'>;
        Update: Partial<Omit<Product, 'id' | 'user_id' | 'category' | 'subcategory' | 'tags'>>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Tag, 'id' | 'user_id'>>;
      };
      product_tags: {
        Row: ProductTag;
        Insert: ProductTag;
        Update: never;
      };
      settings: {
        Row: Settings;
        Insert: Omit<Settings, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Settings, 'user_id'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      status: 'pending' | 'to_buy' | 'purchased';
      priority: 'low' | 'medium' | 'high';
    };
  };
}
