import { combinedWords } from '../registry/keywords';

/**
 * Normalizes a raw SMS message into a clean token array.
 * Includes fixes T1 and T4 from the reference library.
 */
export function normalizeSMS(message: string): string[] {
  if (!message) return [];

  let processed = message.toLowerCase();

  // Support withdrawn/debited patterns
  processed = processed.replace(/\bwithdrawn\s*(?:\/|or)\s*debited\b/gi, 'debited');

  // 1. Remove !
  processed = processed.replace(/!/g, '');

  // 2. Replace : with space
  processed = processed.replace(/:/g, ' ');

  // 3. Remove / (e.g. A/C -> AC)
  processed = processed.replace(/\//g, '');

  // 4. Replace = with space
  processed = processed.replace(/=/g, ' ');

  // 5. Remove {} -> space
  processed = processed.replace(/[{}]/g, ' ');

  // 6. Remove \n, \r
  processed = processed.replace(/[\n\r]/g, ' ');

  // 7. Remove 'ending '
  processed = processed.replace(/\bending\s+/g, '');

  // 8. Remove x and * (FIX T1: only strip x/X when adjacent to digits)
  processed = processed.replace(/(?<=[0-9])x+|x+(?=[0-9])|[*]+/gi, '');

  // 9. Remove 'is ' (FIX T4: use word boundary)
  processed = processed.replace(/\bis\b/gi, '');

  // 10. Remove 'with ' (FIX T4: use word boundary)
  processed = processed.replace(/\bwith\b/gi, '');

  // 11. Remove 'no. '
  processed = processed.replace(/\bno\.\s+/gi, '');

  // 12. Normalize account aliases
  processed = processed.replace(/\bacct\b|\baccount\b/gi, 'ac');

  // 13. Normalize inr/rs to rs.
  // Replace inr/rs followed by a number with rs. [number]
  processed = processed.replace(/\b(?:inr|rs)\.?\s*(\d)/gi, 'rs. $1');
  // Replace standalone inr/rs with rs.
  processed = processed.replace(/\b(?:inr|rs)\b\.?\s*/gi, 'rs. ');
  // Collapse multiple spaces after rs. to single space
  processed = processed.replace(/rs\.\s+/gi, 'rs. ');

  // 14. Pad debited
  processed = processed.replace(/\bdebited\b/gi, ' debited ');

  // 15. Pad credited
  processed = processed.replace(/\bcredited\b/gi, ' credited ');

  // 16. Combined words substitution (e.g. credit card -> c_card)
  for (const item of combinedWords) {
    processed = processed.replace(item.pattern, item.replacement);
  }

  // 17. Split on whitespace + filter empties
  return processed.trim().split(/\s+/).filter(token => token !== '');
}
