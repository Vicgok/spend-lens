/**
 * Calculates the confidence level of a parsed transaction SMS.
 * Returns 'high' | 'medium' | 'low' based on presence of core fields and bonus signals.
 * Addresses U4 from reference.
 */
export function getConfidenceScore(
  amount: number | null,
  balance: number | null,
  accountNumber: string | null,
  type: 'debit' | 'credit' | null,
  merchant: string | null,
  date: string | null,
  isKnownBank: boolean
): 'high' | 'medium' | 'low' {
  let score = 0;

  // Core fields (max 4 points)
  if (amount !== null && amount > 0) {
    score += 2;
  }
  if (balance !== null) {
    score += 1;
  }
  if (accountNumber !== null && accountNumber.trim() !== '') {
    score += 1;
  }

  // Bonus signals (max 4 points)
  if (type !== null) {
    score += 1;
  }
  if (merchant !== null && merchant.trim() !== '') {
    score += 1;
  }
  if (date !== null) {
    score += 1;
  }
  if (isKnownBank) {
    score += 1;
  }

  // Determine classification based on thresholds
  if (score >= 5) {
    return 'high';
  } else if (score >= 3) {
    return 'medium';
  } else {
    return 'low';
  }
}
