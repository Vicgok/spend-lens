/**
 * Validation gate: checks if the parsed fields indicate a valid transaction SMS.
 * Uses the 2-of-3 rule (at least two of amount, balance, or account number must be present).
 * Fixes T2 by correctly checking for null/undefined values.
 */
export function isValidTransaction(
  amount: number | null,
  balance: number | null,
  accountNumber: string | null,
  referenceNo: string | null,
  merchant: string | null
): boolean {
  // Amount is mandatory for any transaction
  if (amount === null || amount === undefined || isNaN(amount) || amount <= 0) {
    return false;
  }

  const otherFields = [balance, accountNumber, referenceNo, merchant];
  
  const presentOthers = otherFields.filter(field => {
    if (field === null || field === undefined) {
      return false;
    }
    if (typeof field === 'string' && field.trim() === '') {
      return false;
    }
    if (typeof field === 'number' && (isNaN(field) || field <= 0)) {
      return false;
    }
    return true;
  });

  return presentOthers.length >= 1;
}
