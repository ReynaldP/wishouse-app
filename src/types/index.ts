export type Status = 'pending' | 'to_buy' | 'purchased';
export type Priority = 'low' | 'medium' | 'high';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  budget: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  user_id: string;
  name: string;
  budget: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  price: number;
  link: string;
  description: string;
  status: Status;
  priority: Priority;
  image_url: string;
  planned_date: string | null;
  is_favorite: boolean;
  pros: string;
  cons: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  subcategory?: Subcategory;
  tags?: Tag[];
}

export interface ProductTag {
  product_id: string;
  tag_id: string;
}

export interface Settings {
  user_id: string;
  total_budget: number;
  currency: string;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetStats {
  totalBudget: number;
  currency: string;
  purchasedTotal: number;
  toBuyTotal: number;
  pendingTotal: number;
  remaining: number;
  percentUsed: number;
  productCount: number;
  averagePrice: number;
  byCategory: CategoryStats[];
  byStatus: {
    pending: { count: number; total: number };
    to_buy: { count: number; total: number };
    purchased: { count: number; total: number };
  };
}

export interface CategoryStats {
  id: string;
  name: string;
  color: string;
  total: number;
  count: number;
  budget: number;
}

export interface ProductFilters {
  category_id?: string;
  subcategory_id?: string;
  status?: Status;
  priority?: Priority;
  tag_id?: string;
  is_favorite?: boolean;
  search?: string;
}

export type ProductInsert = Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'category' | 'subcategory' | 'tags'> & {
  tag_ids?: string[];
};

export type ProductUpdate = Partial<ProductInsert>;

export type CategoryInsert = Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type CategoryUpdate = Partial<CategoryInsert>;

export type SubcategoryInsert = Omit<Subcategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type SubcategoryUpdate = Partial<SubcategoryInsert>;

export type TagInsert = Omit<Tag, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type TagUpdate = Partial<TagInsert>;

export type SettingsUpdate = Partial<Omit<Settings, 'user_id' | 'created_at' | 'updated_at'>>;

// ============================================
// COMPARISON TYPES
// ============================================

export interface ComparisonState {
  isActive: boolean;
  selectedProductIds: string[];
  subcategoryFilter: string | null;
}

export type ComparisonField = 'price' | 'priority' | 'status' | 'planned_date' | 'pros' | 'cons';

export interface ComparisonHighlight {
  field: ComparisonField;
  productId: string;
  type: 'best' | 'worst' | 'neutral';
}

// ============================================
// QUICK ADD TYPES
// ============================================

export interface QuickAddFormData {
  name: string;
  price: number;
  category_id: string | null;
  status: Status;
}

// ============================================
// CHART TYPES
// ============================================

export interface TimelineDataPoint {
  date: string;
  label: string;
  purchased: number;
  to_buy: number;
  pending: number;
  projected: number;
  cumulative: number;
}

export interface TreemapNode {
  name: string;
  value: number;
  color: string;
  children?: TreemapNode[];
  categoryId?: string;
  subcategoryId?: string;
}

export interface StackedBarData {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  color: string;
  categoryId: string;
}

export interface DrilldownState {
  level: 'overview' | 'category' | 'subcategory';
  categoryId?: string;
  subcategoryId?: string;
}

// ============================================
// WEB CLIPPER TYPES
// ============================================

export interface ClippedProduct {
  name: string;
  price: number | null;
  image_url: string;
  link: string;
  description: string;
  source: string;
}

export interface WebClipperResult {
  success: boolean;
  data?: ClippedProduct;
  error?: string;
}

// ============================================
// COMPARISON HISTORY TYPES
// ============================================

export interface ComparisonHistoryItem {
  id: string;
  productIds: string[];
  createdAt: string;
  winnerId?: string;
}

// ============================================
// BUDGET GOALS TYPES
// ============================================

export interface MonthlyBudgetGoal {
  id: string;
  user_id: string;
  month: string; // Format: YYYY-MM
  category_id: string | null;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetForecast {
  month: string;
  label: string;
  projected: number;
  planned: number;
  products: Product[];
}

export interface BudgetAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  categoryId?: string;
  categoryName?: string;
}
