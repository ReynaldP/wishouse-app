import type { Status, Priority } from '@/types';

export const STATUS_CONFIG: Record<Status, { label: string; color: string; bgColor: string }> = {
  pending: {
    label: 'En attente',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  to_buy: {
    label: 'À acheter',
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
  purchased: {
    label: 'Acheté',
    color: 'text-success',
    bgColor: 'bg-success/10'
  }
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; borderColor: string }> = {
  low: {
    label: 'Basse',
    color: 'text-muted-foreground',
    borderColor: 'border-l-muted-foreground/30'
  },
  medium: {
    label: 'Moyenne',
    color: 'text-warning',
    borderColor: 'border-l-warning'
  },
  high: {
    label: 'Haute',
    color: 'text-destructive',
    borderColor: 'border-l-destructive'
  }
};

export const DEFAULT_CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

export const DEFAULT_TAG_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

export const CATEGORY_ICONS = [
  'home',
  'bed',
  'sofa',
  'utensils',
  'bath',
  'lamp',
  'tv',
  'computer',
  'washer',
  'refrigerator',
  'plant',
  'paint-bucket',
  'wrench',
  'car',
  'baby',
  'gamepad',
  'music',
  'book',
  'dumbbell',
  'shirt',
];

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dollar US' },
  { code: 'GBP', symbol: '£', name: 'Livre sterling' },
  { code: 'CHF', symbol: 'CHF', name: 'Franc suisse' },
  { code: 'CAD', symbol: 'CA$', name: 'Dollar canadien' },
];

export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  BUDGET: '/budget',
  SETTINGS: '/settings',
  AUTH: '/auth',
} as const;
