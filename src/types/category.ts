export type CategoryType = 'income' | 'expense' | 'both';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isCustom: boolean;
  keywords: string[];
  parentId: string | null;
  sortOrder: number;
}

export interface CategoryCreateInput {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  keywords?: string[];
  parentId?: string;
}
