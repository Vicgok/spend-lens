import { debitPattern, miscDebitPattern, creditPattern } from '../registry/keywords';

/**
 * Detects whether the transaction type is a 'debit' or 'credit'.
 * Evaluates in priority order: debit > miscDebit > credit.
 */
export function getTransactionType(tokens: string[]): 'debit' | 'credit' | null {
  if (!tokens || tokens.length === 0) return null;

  const joined = tokens.join(' ');

  // Reject OTP / verification messages
  if (/\b(?:otp|verification code|one time password)\b/i.test(joined)) {
    return null;
  }

  // 1. Explicit Debit check
  if (debitPattern.test(joined)) {
    return 'debit';
  }

  // 2. Explicit Credit check
  if (creditPattern.test(joined)) {
    return 'credit';
  }

  // 3. Miscellaneous Debit check
  if (miscDebitPattern.test(joined)) {
    return 'debit';
  }

  return null;
}
