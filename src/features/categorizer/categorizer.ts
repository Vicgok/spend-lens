import { DEFAULT_CATEGORIES } from './categories';
import { TransactionType, Category } from '../../types';

/**
 * Auto-categorize a transaction based on merchant name and description.
 * Uses keyword matching against the provided categories list, or default categories.
 * Returns the category ID of the best match, or 'cat_uncategorized' as fallback.
 */
export function categorizeTransaction(
  merchant: string | null,
  description: string | null,
  type: TransactionType,
  categories: Category[] = DEFAULT_CATEGORIES
): string {
  const searchText = [merchant, description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .trim();

  if (!searchText) return 'cat_uncategorized';

  // Filter categories by transaction type
  const applicableCategories = categories.filter(
    (cat) => cat.type === type || cat.type === 'both'
  );

  let bestMatch: { categoryId: string; score: number } = {
    categoryId: 'cat_uncategorized',
    score: 0,
  };

  for (const category of applicableCategories) {
    let score = 0;
    const keywords = Array.isArray(category.keywords) ? category.keywords : [];
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        // Longer keywords are more specific, so weight them higher
        score += keyword.length;
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { categoryId: category.id, score };
    }
  }

  return bestMatch.categoryId;
}

/**
 * Get a category by its ID from the default categories list.
 */
export function getCategoryById(categoryId: string) {
  return DEFAULT_CATEGORIES.find((cat) => cat.id === categoryId) ?? DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
}

/**
 * Get all categories of a specific type.
 */
export function getCategoriesByType(type: TransactionType) {
  return DEFAULT_CATEGORIES.filter(
    (cat) => cat.type === type || cat.type === 'both'
  );
}
