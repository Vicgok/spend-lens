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
const LOW_SIGNAL_SINGLE_KEYWORDS = new Set([
  'bill',
  'books',
  'fresh',
  'game',
  'hotel',
  'interest',
  'movie',
  'prime',
  'reward',
  'wire',
]);
const WEAK_PHRASE_KEYWORDS = new Set([
  'payment received',
  'sent to',
  'paid to',
  'bank transfer',
]);
const LEARNED_KEYWORD_NOISE_TOKENS = new Set([
  'account',
  'banking',
  'for',
  'from',
  'id',
  'imps',
  'neft',
  'paid',
  'payment',
  'ref',
  'reference',
  'rtgs',
  'sent',
  'through',
  'to',
  'txn',
  'txnid',
  'upi',
  'via',
]);

export interface CategorizationResult {
  categoryId: string;
  confidence: 'none' | 'low' | 'medium' | 'high';
  score: number;
  matchedKeywords: string[];
}

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

function isReferenceLikeToken(token: string): boolean {
  return /\d/.test(token) || /^[a-z]*\d+[a-z\d]*$/i.test(token);
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return haystack === needle || haystack.includes(` ${needle} `) || haystack.startsWith(`${needle} `) || haystack.endsWith(` ${needle}`);
}

function getConfidence(score: number, matchedKeywords: string[], runnerUpScore: number): CategorizationResult['confidence'] {
  if (score <= 0 || matchedKeywords.length === 0) return 'none';

  const margin = score - runnerUpScore;
  const hasPhraseMatch = matchedKeywords.some((keyword) => tokenize(normalizeText(keyword)).length > 1);

  if (score >= 20 && margin >= 8 && matchedKeywords.length >= 2) return 'high';
  if (score >= 12 && (margin >= 4 || hasPhraseMatch)) return 'medium';
  return 'low';
}

function isLowSignalOnlyMatch(matchedKeywords: string[]): boolean {
  return matchedKeywords.length === 1 && LOW_SIGNAL_SINGLE_KEYWORDS.has(normalizeText(matchedKeywords[0]));
}

function scoreKeywordMatch(
  searchText: string,
  tokens: Set<string>,
  keyword: string
): { score: number; normalizedKeyword: string } {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return { score: 0, normalizedKeyword };

  const keywordTokens = tokenize(normalizedKeyword);
  if (keywordTokens.length > 1) {
    if (!containsPhrase(` ${searchText} `, normalizedKeyword)) {
      return { score: 0, normalizedKeyword };
    }

    const score = WEAK_PHRASE_KEYWORDS.has(normalizedKeyword)
      ? Math.max(2, normalizedKeyword.length)
      : normalizedKeyword.length * 4;
    return { score, normalizedKeyword };
  }

  const [token] = keywordTokens;
  if (!tokens.has(token)) return { score: 0, normalizedKeyword };

  const baseScore = token.length * 2;
  const score = WEAK_SINGLE_TOKEN_KEYWORDS.has(token) ? Math.max(1, Math.floor(baseScore / 3)) : baseScore;
  return { score, normalizedKeyword };
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
  return categorizeTransactionDetailed(merchant, description, type, categories).categoryId;
}

export function categorizeTransactionDetailed(
  merchant: string | null,
  description: string | null,
  type: TransactionType,
  categories: Category[] = DEFAULT_CATEGORIES
): CategorizationResult {
  const searchText = normalizeText([merchant, description].filter(Boolean).join(' '));
  if (!searchText) {
    return {
      categoryId: UNCATEGORIZED,
      confidence: 'none',
      score: 0,
      matchedKeywords: [],
    };
  }

  const tokens = new Set(tokenize(searchText));
  const cats = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const applicableCategories = cats.filter((cat) => cat.type === type || cat.type === 'both');

  let bestMatch: { categoryId: string; score: number; matchedKeywordLength: number; matchedKeywords: string[] } = {
    categoryId: UNCATEGORIZED,
    score: 0,
    matchedKeywordLength: 0,
    matchedKeywords: [],
  };
  let runnerUpScore = 0;

  for (const category of applicableCategories) {
    let score = 0;
    let matchedKeywordLength = 0;
    const matchedKeywords: string[] = [];
    const keywords = Array.isArray(category.keywords) ? category.keywords : [];

    for (const keyword of keywords) {
      const { score: keywordScore, normalizedKeyword } = scoreKeywordMatch(searchText, tokens, keyword);
      if (keywordScore <= 0) continue;
      score += keywordScore;
      matchedKeywordLength = Math.max(matchedKeywordLength, normalizedKeyword.length);
      matchedKeywords.push(keyword);
    }

    const isBetterMatch =
      score > bestMatch.score ||
      (score === bestMatch.score && matchedKeywordLength > bestMatch.matchedKeywordLength);

    if (
      isBetterMatch
    ) {
      runnerUpScore = bestMatch.score;
      bestMatch = { categoryId: category.id, score, matchedKeywordLength, matchedKeywords };
    } else if (score > runnerUpScore) {
      runnerUpScore = score;
    }
  }

  if (bestMatch.score <= 0) {
    return {
      categoryId: UNCATEGORIZED,
      confidence: 'none',
      score: 0,
      matchedKeywords: [],
    };
  }

  if (isLowSignalOnlyMatch(bestMatch.matchedKeywords)) {
    return {
      categoryId: UNCATEGORIZED,
      confidence: 'none',
      score: 0,
      matchedKeywords: [],
    };
  }

  return {
    categoryId: bestMatch.categoryId,
    confidence: getConfidence(bestMatch.score, bestMatch.matchedKeywords, runnerUpScore),
    score: bestMatch.score,
    matchedKeywords: bestMatch.matchedKeywords,
  };
}

export function normalizeLearnedKeyword(rawMerchant: string | null | undefined): string {
  const normalized = normalizeText(rawMerchant);
  if (!normalized) return '';

  let tokens = tokenize(normalized).filter((token) => !isReferenceLikeToken(token));
  while (tokens.length > 0 && LEARNED_KEYWORD_NOISE_TOKENS.has(tokens[0])) {
    tokens = tokens.slice(1);
  }
  while (tokens.length > 0 && LEARNED_KEYWORD_NOISE_TOKENS.has(tokens[tokens.length - 1])) {
    tokens = tokens.slice(0, -1);
  }

  return tokens.join(' ');
}

export function getCategoryById(categoryId: string) {
  return DEFAULT_CATEGORIES.find((cat) => cat.id === categoryId) ?? DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
}

export function getCategoriesByType(type: TransactionType) {
  return DEFAULT_CATEGORIES.filter((cat) => cat.type === type || cat.type === 'both');
}
