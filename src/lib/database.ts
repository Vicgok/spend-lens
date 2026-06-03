import * as SQLite from 'expo-sqlite';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

import {
  Transaction,
  TransactionCreateInput,
  TransactionFilter,
  Account,
  AccountCreateInput,
  SavingsGoal,
  SavingsGoalCreateInput,
  Category,
  CategoryCreateInput,
} from '../types';
import { DEFAULT_CATEGORIES } from '../features/categorizer/categories';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('spendlens.db');
      await initializeDatabase(database);
      return database;
    })();
  }
  return dbPromise;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  // Migration: Add bank_id column if the accounts table exists but lacks it
  try {
    const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(accounts)');
    if (columns.length > 0) {
      const hasBankId = columns.some((col) => col.name === 'bank_id');
      if (!hasBankId) {
        await database.execAsync('ALTER TABLE accounts ADD COLUMN bank_id TEXT');
        console.log('Database migration: Added bank_id to accounts table');
      }
    }
  } catch (e) {
    console.warn('Error running accounts migration:', e);
  }

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      icon TEXT,
      color TEXT,
      bank_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      keywords TEXT,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id TEXT,
      merchant TEXT,
      description TEXT,
      date TEXT NOT NULL,
      source TEXT NOT NULL,
      sms_hash TEXT,
      is_recurring INTEGER DEFAULT 0,
      tags TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      deadline TEXT,
      category_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_sms_hash ON transactions(sms_hash);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  `);

  // Seed default categories if empty
  const categoryCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (categoryCount && categoryCount.count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await database.runAsync(
        `INSERT INTO categories (id, name, icon, color, type, is_custom, keywords, parent_id, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        cat.id, cat.name, cat.icon, cat.color, cat.type,
        cat.isCustom ? 1 : 0, JSON.stringify(cat.keywords),
        cat.parentId, cat.sortOrder
      );
    }
  }
}

// ========== ACCOUNTS ==========

export async function createAccount(input: AccountCreateInput): Promise<Account> {
  const database = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  const account: Account = {
    id,
    name: input.name,
    type: input.type,
    balance: input.balance,
    currency: input.currency || 'INR',
    icon: input.icon || null,
    color: input.color || null,
    bankId: input.bankId || null,
    createdAt: now,
    updatedAt: now,
  };
  await database.runAsync(
    `INSERT INTO accounts (id, name, type, balance, currency, icon, color, bank_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    account.id, account.name, account.type, account.balance,
    account.currency, account.icon, account.color, account.bankId, account.createdAt, account.updatedAt
  );
  return account;
}

export async function getAccounts(): Promise<Account[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; name: string; type: string; balance: number;
    currency: string; icon: string | null; color: string | null;
    bank_id: string | null; created_at: string; updated_at: string;
  }>('SELECT * FROM accounts ORDER BY created_at ASC');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as Account['type'],
    balance: row.balance,
    currency: row.currency,
    icon: row.icon,
    color: row.color,
    bankId: row.bank_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function updateAccountBalance(accountId: string, newBalance: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE accounts SET balance = ?, updated_at = ? WHERE id = ?',
    newBalance, new Date().toISOString(), accountId
  );
}

export async function deleteAccount(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM accounts WHERE id = ?', id);
}

// ========== TRANSACTIONS ==========

export async function createTransaction(input: TransactionCreateInput): Promise<Transaction> {
  const database = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  const transaction: Transaction = {
    id,
    accountId: input.accountId,
    type: input.type,
    amount: input.amount,
    categoryId: input.categoryId || null,
    merchant: input.merchant || null,
    description: input.description || null,
    date: input.date || now,
    source: input.source,
    smsHash: input.smsHash || null,
    isRecurring: input.isRecurring || false,
    tags: input.tags || [],
    createdAt: now,
    syncedAt: null,
  };

  await database.runAsync(
    `INSERT INTO transactions (id, account_id, type, amount, category_id, merchant, description, date, source, sms_hash, is_recurring, tags, created_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    transaction.id, transaction.accountId, transaction.type, transaction.amount,
    transaction.categoryId, transaction.merchant, transaction.description,
    transaction.date, transaction.source, transaction.smsHash,
    transaction.isRecurring ? 1 : 0, JSON.stringify(transaction.tags),
    transaction.createdAt, transaction.syncedAt
  );

  // Update account balance
  if (transaction.type === 'expense') {
    await database.runAsync(
      'UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?',
      transaction.amount, now, transaction.accountId
    );
  } else if (transaction.type === 'income') {
    await database.runAsync(
      'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
      transaction.amount, now, transaction.accountId
    );
  }

  return transaction;
}

export async function getTransactions(
  filter?: TransactionFilter,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const database = await getDatabase();
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: (string | number)[] = [];

  if (filter?.dateFrom) {
    query += ' AND date >= ?';
    params.push(filter.dateFrom);
  }
  if (filter?.dateTo) {
    query += ' AND date <= ?';
    params.push(filter.dateTo);
  }
  if (filter?.categoryId) {
    query += ' AND category_id = ?';
    params.push(filter.categoryId);
  }
  if (filter?.type) {
    query += ' AND type = ?';
    params.push(filter.type);
  }
  if (filter?.source) {
    query += ' AND source = ?';
    params.push(filter.source);
  }
  if (filter?.accountId) {
    query += ' AND account_id = ?';
    params.push(filter.accountId);
  }
  if (filter?.searchQuery) {
    query += ' AND (merchant LIKE ? OR description LIKE ?)';
    const searchTerm = `%${filter.searchQuery}%`;
    params.push(searchTerm, searchTerm);
  }

  query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = await database.getAllAsync<{
    id: string; account_id: string; type: string; amount: number;
    category_id: string | null; merchant: string | null; description: string | null;
    date: string; source: string; sms_hash: string | null; is_recurring: number;
    tags: string | null; created_at: string; synced_at: string | null;
  }>(query, ...params);

  return rows.map((row) => ({
    id: row.id,
    accountId: row.account_id,
    type: row.type as Transaction['type'],
    amount: row.amount,
    categoryId: row.category_id,
    merchant: row.merchant,
    description: row.description,
    date: row.date,
    source: row.source as Transaction['source'],
    smsHash: row.sms_hash,
    isRecurring: row.is_recurring === 1,
    tags: row.tags ? JSON.parse(row.tags) : [],
    createdAt: row.created_at,
    syncedAt: row.synced_at,
  }));
}

export async function deleteTransaction(id: string): Promise<void> {
  const database = await getDatabase();
  // First get the transaction to reverse balance
  const tx = await database.getFirstAsync<{
    account_id: string; type: string; amount: number;
  }>('SELECT account_id, type, amount FROM transactions WHERE id = ?', id);

  if (tx) {
    if (tx.type === 'expense') {
      await database.runAsync(
        'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
        tx.amount, new Date().toISOString(), tx.account_id
      );
    } else if (tx.type === 'income') {
      await database.runAsync(
        'UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?',
        tx.amount, new Date().toISOString(), tx.account_id
      );
    }
  }

  await database.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function updateTransactionCategory(id: string, categoryId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE transactions SET category_id = ? WHERE id = ?',
    categoryId, id
  );
}

export async function updateTransaction(
  id: string,
  updates: {
    categoryId?: string | null;
    merchant?: string | null;
    description?: string | null;
    amount?: number;
    date?: string;
  }
): Promise<void> {
  const database = await getDatabase();
  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.categoryId !== undefined) {
    setClauses.push('category_id = ?');
    params.push(updates.categoryId);
  }
  if (updates.merchant !== undefined) {
    setClauses.push('merchant = ?');
    params.push(updates.merchant);
  }
  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    params.push(updates.description);
  }
  if (updates.amount !== undefined) {
    const oldTx = await database.getFirstAsync<{ amount: number; type: string; account_id: string }>(
      'SELECT amount, type, account_id FROM transactions WHERE id = ?',
      id
    );
    if (oldTx) {
      const diff = updates.amount - oldTx.amount;
      if (diff !== 0) {
        setClauses.push('amount = ?');
        params.push(updates.amount);
        
        let balanceAdjustment = 0;
        if (oldTx.type === 'expense') {
          balanceAdjustment = -diff;
        } else if (oldTx.type === 'income') {
          balanceAdjustment = diff;
        }
        
        if (balanceAdjustment !== 0) {
          await database.runAsync(
            'UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?',
            balanceAdjustment, new Date().toISOString(), oldTx.account_id
          );
        }
      }
    }
  }
  if (updates.date !== undefined) {
    setClauses.push('date = ?');
    params.push(updates.date);
  }

  if (setClauses.length === 0) return;

  params.push(id);
  await database.runAsync(
    `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ?`,
    ...params
  );
}

export async function checkSMSHashExists(hash: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions WHERE sms_hash = ?', hash
  );
  return (result?.count ?? 0) > 0;
}

// ========== ANALYTICS ==========

export async function getMonthlyTotals(dateFrom: string, dateTo: string) {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{
    total_income: number; total_expense: number; tx_count: number;
  }>(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
      COUNT(*) as tx_count
     FROM transactions
     WHERE date >= ? AND date <= ?`,
    dateFrom, dateTo
  );
  return {
    totalIncome: result?.total_income ?? 0,
    totalExpense: result?.total_expense ?? 0,
    transactionCount: result?.tx_count ?? 0,
  };
}

export async function getCategoryTotals(dateFrom: string, dateTo: string) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    category_id: string; cat_name: string; cat_icon: string;
    cat_color: string; total: number; count: number;
  }>(
    `SELECT
      t.category_id,
      c.name as cat_name,
      c.icon as cat_icon,
      c.color as cat_color,
      SUM(t.amount) as total,
      COUNT(*) as count
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.date >= ? AND t.date <= ? AND t.type = 'expense'
     GROUP BY t.category_id
     ORDER BY total DESC`,
    dateFrom, dateTo
  );
  return rows;
}

export async function getDailyTotals(dateFrom: string, dateTo: string) {
  const database = await getDatabase();
  return database.getAllAsync<{
    day: string; income: number; expense: number;
  }>(
    `SELECT
      DATE(date) as day,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date <= ?
     GROUP BY DATE(date)
     ORDER BY day ASC`,
    dateFrom, dateTo
  );
}

// ========== GOALS ==========

export async function createGoal(input: SavingsGoalCreateInput): Promise<SavingsGoal> {
  const database = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();
  const goal: SavingsGoal = {
    id,
    title: input.title,
    targetAmount: input.targetAmount,
    currentAmount: 0,
    deadline: input.deadline || null,
    categoryId: input.categoryId || null,
    status: 'active',
    createdAt: now,
  };
  await database.runAsync(
    `INSERT INTO goals (id, title, target_amount, current_amount, deadline, category_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    goal.id, goal.title, goal.targetAmount, goal.currentAmount,
    goal.deadline, goal.categoryId, goal.status, goal.createdAt
  );
  return goal;
}

export async function getGoals(): Promise<SavingsGoal[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string; title: string; target_amount: number; current_amount: number;
    deadline: string | null; category_id: string | null; status: string; created_at: string;
  }>('SELECT * FROM goals ORDER BY created_at DESC');
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    deadline: row.deadline,
    categoryId: row.category_id,
    status: row.status as SavingsGoal['status'],
    createdAt: row.created_at,
  }));
}

// ========== SETTINGS ==========

export async function getSetting(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?', key
  );
  return row?.value || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key, value
  );
}

// ========== CATEGORIES ==========

export async function getCategories(): Promise<Category[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
    is_custom: number;
    keywords: string | null;
    parent_id: string | null;
    sort_order: number;
  }>('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type as Category['type'],
    isCustom: row.is_custom === 1,
    keywords: row.keywords ? JSON.parse(row.keywords) : [],
    parentId: row.parent_id,
    sortOrder: row.sort_order,
  }));
}

export async function updateCategoryKeywords(id: string, keywords: string[]): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE categories SET keywords = ? WHERE id = ?',
    JSON.stringify(keywords), id
  );
}

export async function createCategory(input: CategoryCreateInput): Promise<Category> {
  const database = await getDatabase();
  const id = 'cat_custom_' + generateId();
  const category: Category = {
    id,
    name: input.name,
    icon: input.icon,
    color: input.color,
    type: input.type,
    isCustom: true,
    keywords: input.keywords || [],
    parentId: input.parentId || null,
    sortOrder: 50,
  };

  await database.runAsync(
    `INSERT INTO categories (id, name, icon, color, type, is_custom, keywords, parent_id, sort_order)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    category.id, category.name, category.icon, category.color, category.type,
    JSON.stringify(category.keywords), category.parentId, category.sortOrder
  );

  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  const database = await getDatabase();
  
  // Re-assign transactions belonging to this category to 'cat_uncategorized'
  await database.runAsync(
    "UPDATE transactions SET category_id = 'cat_uncategorized' WHERE category_id = ?",
    id
  );
  
  await database.runAsync('DELETE FROM categories WHERE id = ?', id);
}
