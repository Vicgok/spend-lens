import { create } from 'zustand';
import {
  Transaction,
  TransactionCreateInput,
  TransactionFilter,
  Account,
  AccountCreateInput,
  CategoryTotal,
  Category,
  CategoryCreateInput,
} from '../types';
import * as db from '../lib/database';
import { getMonthRange } from '../utils/date';
import { categorizeTransaction } from '../features/categorizer/categorizer';

interface TransactionState {
  // Data
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  monthlyTotals: {
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
  };
  categoryTotals: CategoryTotal[];
  isLoading: boolean;
  currentFilter: TransactionFilter;

  // Actions
  loadAccounts: () => Promise<void>;
  createAccount: (input: AccountCreateInput) => Promise<Account>;
  loadTransactions: (filter?: TransactionFilter) => Promise<void>;
  addTransaction: (input: TransactionCreateInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  updateCategory: (txId: string, categoryId: string) => Promise<void>;
  editTransaction: (
    id: string,
    updates: {
      categoryId?: string | null;
      merchant?: string | null;
      description?: string | null;
      amount?: number;
      date?: string;
    }
  ) => Promise<void>;
  loadMonthlyStats: () => Promise<void>;
  setFilter: (filter: TransactionFilter) => void;
  getTotalBalance: () => number;
  
  // Category actions
  loadCategories: () => Promise<void>;
  createCategory: (input: CategoryCreateInput) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategoryKeywords: (id: string, keywords: string[]) => Promise<void>;
  learnCategoryKeyword: (categoryId: string, rawMerchant: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  accounts: [],
  categories: [],
  monthlyTotals: { totalIncome: 0, totalExpense: 0, transactionCount: 0 },
  categoryTotals: [],
  isLoading: false,
  currentFilter: {},

  loadAccounts: async () => {
    const accounts = await db.getAccounts();
    set({ accounts });
  },

  createAccount: async (input) => {
    const account = await db.createAccount(input);
    set((state) => ({ accounts: [...state.accounts, account] }));
    return account;
  },

  loadTransactions: async (filter) => {
    set({ isLoading: true });
    const appliedFilter = filter || get().currentFilter;
    const transactions = await db.getTransactions(appliedFilter);
    set({ transactions, isLoading: false, currentFilter: appliedFilter });
  },

  addTransaction: async (input) => {
    // Auto-categorize if no category specified
    if (!input.categoryId) {
      input.categoryId = categorizeTransaction(
        input.merchant || null,
        input.description || null,
        input.type,
        get().categories
      );
    }

    const transaction = await db.createTransaction(input);
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    }));

    // Refresh accounts (balance changed) and stats
    await get().loadAccounts();
    await get().loadMonthlyStats();

    return transaction;
  },

  deleteTransaction: async (id) => {
    await db.deleteTransaction(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    await get().loadAccounts();
    await get().loadMonthlyStats();
  },

  updateCategory: async (txId, categoryId) => {
    const transactions = get().transactions;
    const tx = transactions.find((t) => t.id === txId);

    // Learn from feedback loop if user corrected category
    if (tx && categoryId !== tx.categoryId) {
      const merchantName = tx.merchant;
      if (merchantName) {
        await get().learnCategoryKeyword(categoryId, merchantName);
      }
    }

    await db.updateTransactionCategory(txId, categoryId);
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === txId ? { ...t, categoryId } : t
      ),
    }));
    await get().loadMonthlyStats();
  },

  editTransaction: async (id, updates) => {
    const transactions = get().transactions;
    const tx = transactions.find((t) => t.id === id);

    // Learn from feedback loop if user corrected category
    if (tx && updates.categoryId && updates.categoryId !== tx.categoryId) {
      const merchantName = updates.merchant !== undefined ? updates.merchant : tx.merchant;
      if (merchantName) {
        await get().learnCategoryKeyword(updates.categoryId, merchantName);
      }
    }

    await db.updateTransaction(id, updates);
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
    await get().loadAccounts();
    await get().loadMonthlyStats();
  },

  loadMonthlyStats: async () => {
    const { start, end } = getMonthRange();
    const totals = await db.getMonthlyTotals(start, end);
    const catRows = await db.getCategoryTotals(start, end);

    const totalExpense = totals.totalExpense;
    const categoryTotals: CategoryTotal[] = catRows.map((row) => ({
      categoryId: row.category_id,
      categoryName: row.cat_name || 'Other',
      categoryIcon: row.cat_icon || 'circle-help',
      categoryColor: row.cat_color || '#8B949E',
      total: row.total,
      count: row.count,
      percentage: totalExpense > 0 ? (row.total / totalExpense) * 100 : 0,
    }));

    set({
      monthlyTotals: {
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        transactionCount: totals.transactionCount,
      },
      categoryTotals,
    });
  },

  setFilter: (filter) => {
    set({ currentFilter: filter });
    get().loadTransactions(filter);
  },

  getTotalBalance: () => {
    return get().accounts.reduce((sum, acc) => sum + acc.balance, 0);
  },

  loadCategories: async () => {
    const categories = await db.getCategories();
    set({ categories });
  },

  createCategory: async (input) => {
    const category = await db.createCategory(input);
    await get().loadCategories();
    return category;
  },

  updateCategoryKeywords: async (id, keywords) => {
    await db.updateCategoryKeywords(id, keywords);
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, keywords } : c
      ),
    }));
  },

  deleteCategory: async (id) => {
    await db.deleteCategory(id);
    await get().loadCategories();
    // Reload transactions since deletion reassigned transactions
    await get().loadTransactions();
    await get().loadMonthlyStats();
  },

  learnCategoryKeyword: async (categoryId, rawMerchant) => {
    if (!rawMerchant) return;
    const keyword = rawMerchant.trim().toLowerCase().replace(/\s+/g, ' ');
    if (keyword.length < 2) return;

    const categories = [...get().categories];
    let updatedAny = false;

    // Remove keyword from other categories to avoid matching conflicts
    for (const cat of categories) {
      if (cat.id !== categoryId && cat.keywords.includes(keyword)) {
        cat.keywords = cat.keywords.filter((kw) => kw !== keyword);
        await db.updateCategoryKeywords(cat.id, cat.keywords);
        updatedAny = true;
      }
    }

    // Add keyword to corrected category
    const targetCat = categories.find((cat) => cat.id === categoryId);
    if (targetCat && !targetCat.keywords.includes(keyword)) {
      targetCat.keywords = [...targetCat.keywords, keyword];
      await db.updateCategoryKeywords(targetCat.id, targetCat.keywords);
      updatedAny = true;
    }

    if (updatedAny) {
      set({ categories });
    }
  },
}));
