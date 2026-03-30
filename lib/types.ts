export type ExpenseCategory =
  | 'food'
  | 'shopping'
  | 'transport'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'travel'
  | 'groceries'
  | 'other';

export type IncomeCategory =
  | 'salary'
  | 'freelance'
  | 'refund'
  | 'investment'
  | 'gift'
  | 'cashback'
  | 'rental'
  | 'other';

export type PaymentMedium =
  | 'credit_card'
  | 'debit_card'
  | 'upi'
  | 'cash'
  | 'net_banking'
  | 'wallet'
  | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  paymentMedium: PaymentMedium;
  cardInfo?: string;
  date: string;
  createdAt: string;
}

export interface Income {
  id: string;
  amount: number;
  category: IncomeCategory;
  note: string;
  source: string;
  date: string;
  createdAt: string;
}

export interface CategoryInfo {
  key: ExpenseCategory;
  label: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather' | 'MaterialIcons';
  color: string;
  bgColor: string;
}

export interface IncomeCategoryInfo {
  key: IncomeCategory;
  label: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather' | 'MaterialIcons';
  color: string;
  bgColor: string;
}

export interface PaymentMediumInfo {
  key: PaymentMedium;
  label: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather' | 'MaterialIcons';
}
