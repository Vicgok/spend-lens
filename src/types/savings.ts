export type GoalStatus = 'active' | 'completed' | 'paused';

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  categoryId: string | null;
  status: GoalStatus;
  createdAt: string;
}

export interface SavingsGoalCreateInput {
  title: string;
  targetAmount: number;
  deadline?: string;
  categoryId?: string;
}

export interface SavingsTip {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  categoryId: string | null;
  priority: 'high' | 'medium' | 'low';
}

export interface SpendingInsight {
  categoryId: string;
  categoryName: string;
  currentMonthTotal: number;
  previousMonthTotal: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  averageDaily: number;
}

export interface MonthlyReport {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  savingsRate: number;
  topCategories: {
    categoryId: string;
    categoryName: string;
    total: number;
    percentage: number;
  }[];
  insights: SpendingInsight[];
  tips: SavingsTip[];
}
