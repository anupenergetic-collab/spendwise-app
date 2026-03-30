import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Income } from './types';

const EXPENSES_KEY = '@spendwise_expenses';
const INCOME_KEY = '@spendwise_income';

export async function getExpenses(): Promise<Expense[]> {
  const data = await AsyncStorage.getItem(EXPENSES_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function saveExpense(expense: Expense): Promise<void> {
  const expenses = await getExpenses();
  expenses.unshift(expense);
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export async function deleteExpense(id: string): Promise<void> {
  const expenses = await getExpenses();
  const filtered = expenses.filter(e => e.id !== id);
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(filtered));
}

export async function updateExpense(updated: Expense): Promise<void> {
  const expenses = await getExpenses();
  const idx = expenses.findIndex(e => e.id === updated.id);
  if (idx !== -1) {
    expenses[idx] = updated;
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }
}

export async function clearAllExpenses(): Promise<void> {
  await AsyncStorage.removeItem(EXPENSES_KEY);
}

export async function getIncomes(): Promise<Income[]> {
  const data = await AsyncStorage.getItem(INCOME_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export async function saveIncome(income: Income): Promise<void> {
  const incomes = await getIncomes();
  incomes.unshift(income);
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(incomes));
}

export async function deleteIncome(id: string): Promise<void> {
  const incomes = await getIncomes();
  const filtered = incomes.filter(i => i.id !== id);
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(filtered));
}

export async function updateIncome(updated: Income): Promise<void> {
  const incomes = await getIncomes();
  const idx = incomes.findIndex(i => i.id === updated.id);
  if (idx !== -1) {
    incomes[idx] = updated;
    await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(incomes));
  }
}

export async function restoreExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export async function restoreIncomes(incomes: Income[]): Promise<void> {
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(incomes));
}
