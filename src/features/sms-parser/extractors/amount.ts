import { debitPattern, creditPattern, miscDebitPattern, availableBalanceKeywords } from '../registry/keywords';

/**
 * Extracts the transaction amount from a normalized token array.
 * Fixes T3 by evaluating all "rs." occurrences and picking the one closest
 * to transaction keywords and furthest from balance keywords.
 * Fixes T16 by including array bounds checking.
 */
export function getTransactionAmount(tokens: string[]): number | null {
  if (!tokens || tokens.length === 0) return null;

  // Find all indices of "rs."
  const rsIndices: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === 'rs.') {
      rsIndices.push(i);
    }
  }

  if (rsIndices.length === 0) return null;

  const candidates: { amount: number; index: number; score: number }[] = [];

  for (const index of rsIndices) {
    let amountStr = '';
    let foundIndex = -1;

    // Check index + 1
    if (index + 1 < tokens.length) {
      const val = tokens[index + 1].replace(/,/g, '');
      const parsedVal = parseFloat(val);
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amountStr = val;
        foundIndex = index + 1;
      }
    }

    // Check index + 2 (lookahead by 1)
    if (!amountStr && index + 2 < tokens.length) {
      const val = tokens[index + 2].replace(/,/g, '');
      const parsedVal = parseFloat(val);
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amountStr = val;
        foundIndex = index + 2;
      }
    }

    if (amountStr) {
      const amount = parseFloat(amountStr);
      let score = 0;

      // Heuristic 1: Preceded by balance keyword? (Check up to 3 tokens before "rs.")
      const prevTokens = tokens.slice(Math.max(0, index - 3), index);
      const isBalance = prevTokens.some(token => {
        return availableBalanceKeywords.some(keyword => {
          // Splitting multi-word keywords to match individual tokens
          const keywordParts = keyword.split(/\s+/);
          return keywordParts.includes(token);
        });
      });

      if (isBalance) {
        score -= 100; // Large penalty for balance-related amounts
      }

      // Heuristic 2: Proximity to debit/credit action keywords (Check 3 tokens before/after)
      const surroundingTokens = tokens.slice(Math.max(0, index - 3), Math.min(tokens.length, index + 4));
      const hasActionKeyword = surroundingTokens.some(token => 
        debitPattern.test(token) || creditPattern.test(token) || miscDebitPattern.test(token)
      );

      if (hasActionKeyword) {
        score += 50; // Bonus for transaction activity
      }

      // Heuristic 3: Positional bias (earlier rs. is usually the transaction amount)
      score -= index * 2;

      candidates.push({ amount, index, score });
    }
  }

  if (candidates.length === 0) return null;

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  return candidates[0].amount;
}
