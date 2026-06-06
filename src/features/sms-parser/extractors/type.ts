import { debitPattern, miscDebitPattern, creditPattern } from '../registry/keywords';

/**
 * Detects whether the transaction type is a 'debit' or 'credit'.
 * Evaluates in priority order: debit > miscDebit > credit.
 */
export function getTransactionType(tokens: string[]): 'debit' | 'credit' | null {
  if (!tokens || tokens.length === 0) return null;

  const joined = tokens.join(' ');

  // 1. Debit check
  if (debitPattern.test(joined)) {
    return 'debit';
  }

  // 2. Misc Debit check
  if (miscDebitPattern.test(joined)) {
    return 'debit';
  }

  // 3. Credit check
  if (creditPattern.test(joined)) {
    return 'credit';
  }

  return null;
}
