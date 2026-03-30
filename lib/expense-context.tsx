import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { Expense, Income, ExpenseCategory, IncomeCategory } from './types';
import * as Storage from './storage';
import * as Crypto from 'expo-crypto';

interface ExpenseContextValue {
  expenses: Expense[];
  incomes: Income[];
  isLoading: boolean;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  editExpense: (expense: Expense) => Promise<void>;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => Promise<void>;
  removeIncome: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  restoreAll: (expenses: Expense[], incomes: Income[]) => Promise<void>;
  getTodayExpenseTotal: () => number;
  getWeekExpenseTotal: () => number;
  getMonthExpenseTotal: () => number;
  getMonthIncomeTotal: () => number;
  getMonthBalance: () => number;
  getCategoryTotals: () => { category: ExpenseCategory; total: number }[];
  getIncomeCategoryTotals: () => { category: IncomeCategory; total: number }[];
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    const [expData, incData] = await Promise.all([Storage.getExpenses(), Storage.getIncomes()]);
    setExpenses(expData);
    setIncomes(incData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const expense: Expense = {
      ...expenseData,
      id: Crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await Storage.saveExpense(expense);
    setExpenses(prev => [expense, ...prev]);
  }, []);

  const removeExpense = useCallback(async (id: string) => {
    await Storage.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const editExpense = useCallback(async (expense: Expense) => {
    await Storage.updateExpense(expense);
    setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
  }, []);

  const addIncome = useCallback(async (incomeData: Omit<Income, 'id' | 'createdAt'>) => {
    const income: Income = {
      ...incomeData,
      id: Crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await Storage.saveIncome(income);
    setIncomes(prev => [income, ...prev]);
  }, []);

  const removeIncome = useCallback(async (id: string) => {
    await Storage.deleteIncome(id);
    setIncomes(prev => prev.filter(i => i.id !== id));
  }, []);

  const restoreAll = useCallback(async (restoredExpenses: Expense[], restoredIncomes: Income[]) => {
    await Storage.restoreExpenses(restoredExpenses);
    await Storage.restoreIncomes(restoredIncomes);
    setExpenses(restoredExpenses);
    setIncomes(restoredIncomes);
  }, []);

  const getTodayExpenseTotal = useCallback(() => {
    return expenses.filter(e => isToday(e.date)).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getWeekExpenseTotal = useCallback(() => {
    return expenses.filter(e => isThisWeek(e.date)).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getMonthExpenseTotal = useCallback(() => {
    return expenses.filter(e => isThisMonth(e.date)).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getMonthIncomeTotal = useCallback(() => {
    return incomes.filter(i => isThisMonth(i.date)).reduce((sum, i) => sum + i.amount, 0);
  }, [incomes]);

  const getMonthBalance = useCallback(() => {
    return getMonthIncomeTotal() - getMonthExpenseTotal();
  }, [getMonthIncomeTotal, getMonthExpenseTotal]);

  const getCategoryTotals = useCallback(() => {
    const monthExpenses = expenses.filter(e => isThisMonth(e.date));
    const totals: Record<string, number> = {};
    monthExpenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([category, total]) => ({ category: category as ExpenseCategory, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const getIncomeCategoryTotals = useCallback(() => {
    const monthIncomes = incomes.filter(i => isThisMonth(i.date));
    const totals: Record<string, number> = {};
    monthIncomes.forEach(i => {
      totals[i.category] = (totals[i.category] || 0) + i.amount;
    });
    return Object.entries(totals)
      .map(([category, total]) => ({ category: category as IncomeCategory, total }))
      .sort((a, b) => b.total - a.total);
  }, [incomes]);

  const value = useMemo(() => ({
    expenses,
    incomes,
    isLoading,
    addExpense,
    removeExpense,
    editExpense,
    addIncome,
    removeIncome,
    refreshAll,
    restoreAll,
    getTodayExpenseTotal,
    getWeekExpenseTotal,
    getMonthExpenseTotal,
    getMonthIncomeTotal,
    getMonthBalance,
    getCategoryTotals,
    getIncomeCategoryTotals,
  }), [expenses, incomes, isLoading, addExpense, removeExpense, editExpense, addIncome, removeIncome, refreshAll, restoreAll, getTodayExpenseTotal, getWeekExpenseTotal, getMonthExpenseTotal, getMonthIncomeTotal, getMonthBalance, getCategoryTotals, getIncomeCategoryTotals]);

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
