/**
 * Extracts reference numbers (UPI Ref, IMPS Ref, NEFT Ref, Txn ID, UTR) from raw SMS.
 * Fixes T5 by using word-boundary matches for reference keywords.
 */
export function getReferenceNumber(rawMessage: string): string | null {
  if (!rawMessage) return null;

  // Common reference keywords with boundary checks and optional delimiters
  const patterns = [
    /\b(?:ref\s*no|ref|upi\s*ref|upi\s*ref\s*no|txn\s*id|utr|imps\s*ref|neft\s*ref)\b\.?\s*[:=-]?\s*([a-zA-Z0-9]+)/i,
    /\b(?:transaction\s*id|txn\s*no|reference\s*no|reference|txn)\b\.?\s*[:=-]?\s*([a-zA-Z0-9]+)/i
  ];

  for (const pattern of patterns) {
    const match = rawMessage.match(pattern);
    if (match && match[1]) {
      const ref = match[1].trim();
      // Plausibility check: reference number should be alphanumeric and between 4 and 25 chars.
      // Most bank reference IDs are purely numeric or start with letters and have digits.
      if (ref.length >= 4 && ref.length <= 25) {
        // Exclude common words that might be captured by loose boundaries
        if (!/^(?:for|the|was|has|and|avl|bal|rs|inr)$/i.test(ref)) {
          return ref;
        }
      }
    }
  }

  return null;
}
