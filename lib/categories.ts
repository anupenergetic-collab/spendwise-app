import { CategoryInfo, IncomeCategoryInfo, PaymentMediumInfo } from './types';

export const CATEGORIES: CategoryInfo[] = [
  { key: 'food', label: 'Food & Dining', icon: 'restaurant', iconFamily: 'MaterialIcons', color: '#F59E0B', bgColor: '#FFFBEB' },
  { key: 'shopping', label: 'Shopping', icon: 'shopping-bag', iconFamily: 'Feather', color: '#EC4899', bgColor: '#FDF2F8' },
  { key: 'transport', label: 'Transport', icon: 'car', iconFamily: 'Ionicons', color: '#3B82F6', bgColor: '#EFF6FF' },
  { key: 'bills', label: 'Bills & Utilities', icon: 'receipt', iconFamily: 'MaterialIcons', color: '#EF4444', bgColor: '#FEF2F2' },
  { key: 'entertainment', label: 'Entertainment', icon: 'film', iconFamily: 'Feather', color: '#8B5CF6', bgColor: '#F5F3FF' },
  { key: 'health', label: 'Health', icon: 'heart', iconFamily: 'Feather', color: '#10B981', bgColor: '#ECFDF5' },
  { key: 'education', label: 'Education', icon: 'book', iconFamily: 'Feather', color: '#6366F1', bgColor: '#EEF2FF' },
  { key: 'travel', label: 'Travel', icon: 'airplane', iconFamily: 'Ionicons', color: '#14B8A6', bgColor: '#F0FDFA' },
  { key: 'groceries', label: 'Groceries', icon: 'cart', iconFamily: 'Ionicons', color: '#84CC16', bgColor: '#F7FEE7' },
  { key: 'other', label: 'Other', icon: 'grid', iconFamily: 'Feather', color: '#6B7280', bgColor: '#F3F4F6' },
];

export const INCOME_CATEGORIES: IncomeCategoryInfo[] = [
  { key: 'salary', label: 'Salary', icon: 'briefcase', iconFamily: 'Feather', color: '#0D9373', bgColor: '#E8F5F1' },
  { key: 'freelance', label: 'Freelance', icon: 'code', iconFamily: 'Feather', color: '#3B82F6', bgColor: '#EFF6FF' },
  { key: 'refund', label: 'Refund', icon: 'rotate-ccw', iconFamily: 'Feather', color: '#F59E0B', bgColor: '#FFFBEB' },
  { key: 'investment', label: 'Investment', icon: 'trending-up', iconFamily: 'Feather', color: '#8B5CF6', bgColor: '#F5F3FF' },
  { key: 'gift', label: 'Gift', icon: 'gift', iconFamily: 'Feather', color: '#EC4899', bgColor: '#FDF2F8' },
  { key: 'cashback', label: 'Cashback', icon: 'percent', iconFamily: 'Feather', color: '#14B8A6', bgColor: '#F0FDFA' },
  { key: 'rental', label: 'Rental Income', icon: 'home', iconFamily: 'Feather', color: '#6366F1', bgColor: '#EEF2FF' },
  { key: 'other', label: 'Other', icon: 'grid', iconFamily: 'Feather', color: '#6B7280', bgColor: '#F3F4F6' },
];

export const PAYMENT_MEDIUMS: PaymentMediumInfo[] = [
  { key: 'credit_card', label: 'Credit Card', icon: 'card', iconFamily: 'Ionicons' },
  { key: 'debit_card', label: 'Debit Card', icon: 'card-outline', iconFamily: 'Ionicons' },
  { key: 'upi', label: 'UPI', icon: 'phone-portrait', iconFamily: 'Ionicons' },
  { key: 'cash', label: 'Cash', icon: 'cash', iconFamily: 'Ionicons' },
  { key: 'net_banking', label: 'Net Banking', icon: 'globe', iconFamily: 'Feather' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet', iconFamily: 'Ionicons' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal', iconFamily: 'Ionicons' },
];

export function getCategoryInfo(key: string): CategoryInfo {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
}

export function getIncomeCategoryInfo(key: string): IncomeCategoryInfo {
  return INCOME_CATEGORIES.find(c => c.key === key) || INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1];
}

export function getPaymentMediumInfo(key: string): PaymentMediumInfo {
  return PAYMENT_MEDIUMS.find(p => p.key === key) || PAYMENT_MEDIUMS[PAYMENT_MEDIUMS.length - 1];
}
