import { DEFAULT_CATEGORIES } from './categories';
import { TransactionType, Category } from '../../types';

const UNCATEGORIZED = 'cat_uncategorized';
const WEAK_SINGLE_TOKEN_KEYWORDS = new Set([
  'credited',
  'received',
  'refund',
  'cashback',
  'transfer',
  'transferred',
  'sent',
  'paid',
]);

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return value.split(' ').filter(Boolean);
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return haystack === needle || haystack.includes(` ${needle} `) || haystack.startsWith(`${needle} `) || haystack.endsWith(` ${needle}`);
}

function scoreKeywordMatch(searchText: string, tokens: Set<string>, keyword: string): number {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return 0;

  const keywordTokens = tokenize(normalizedKeyword);
  if (keywordTokens.length > 1) {
    return containsPhrase(` ${searchText} `, normalizedKeyword) ? normalizedKeyword.length * 4 : 0;
  }

  const [token] = keywordTokens;
  if (!tokens.has(token)) return 0;

  const baseScore = token.length * 2;
  return WEAK_SINGLE_TOKEN_KEYWORDS.has(token) ? Math.max(1, Math.floor(baseScore / 3)) : baseScore;
}

/**
 * Auto-categorize a transaction based on merchant name and description.
 * Uses normalized phrase and token matching against the provided categories list.
 * Returns the category ID of the best match, or 'cat_uncategorized' as fallback.
 */
export function categorizeTransaction(
  merchant: string | null,
  description: string | null,
  type: TransactionType,
  categories: Category[] = DEFAULT_CATEGORIES
): string {
  const searchText = normalizeText([merchant, description].filter(Boolean).join(' '));
  if (!searchText) return UNCATEGORIZED;

  const tokens = new Set(tokenize(searchText));
  const cats = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const applicableCategories = cats.filter((cat) => cat.type === type || cat.type === 'both');

  let bestMatch: { categoryId: string; score: number; matchedKeywordLength: number } = {
    categoryId: UNCATEGORIZED,
    score: 0,
    matchedKeywordLength: 0,
  };

  for (const category of applicableCategories) {
    let score = 0;
    let matchedKeywordLength = 0;
    const keywords = Array.isArray(category.keywords) ? category.keywords : [];

    for (const keyword of keywords) {
      const keywordScore = scoreKeywordMatch(searchText, tokens, keyword);
      if (keywordScore <= 0) continue;
      score += keywordScore;
      matchedKeywordLength = Math.max(matchedKeywordLength, normalizeText(keyword).length);
    }

    if (
      score > bestMatch.score ||
      (score === bestMatch.score && matchedKeywordLength > bestMatch.matchedKeywordLength)
    ) {
      bestMatch = { categoryId: category.id, score, matchedKeywordLength };
    }
  }

  return bestMatch.score > 0 ? bestMatch.categoryId : UNCATEGORIZED;
}

export function getCategoryById(categoryId: string) {
  return DEFAULT_CATEGORIES.find((cat) => cat.id === categoryId) ?? DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
}

export function getCategoriesByType(type: TransactionType) {
  return DEFAULT_CATEGORIES.filter((cat) => cat.type === type || cat.type === 'both');
}
