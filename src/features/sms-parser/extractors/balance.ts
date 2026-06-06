import { availableBalanceKeywords, outstandingBalanceKeywords } from '../registry/keywords';

/**
 * Extracts available or outstanding balance from a normalized token array.
 * Fixes T9 by using substring() instead of deprecated substr().
 * Fixes T16 by adding safety bounds.
 */
export function getBalance(tokens: string[], type: 'AVAILABLE' | 'OUTSTANDING'): number | null {
  if (!tokens || tokens.length === 0) return null;

  const joined = tokens.join(' ');
  const keywords = type === 'AVAILABLE' ? availableBalanceKeywords : outstandingBalanceKeywords;

  let matchedKeyword = '';
  let matchIndex = -1;

  for (const keyword of keywords) {
    const idx = joined.indexOf(keyword);
    if (idx !== -1) {
      // If parsing available balance, verify it is not preceded by "outstanding"
      if (type === 'AVAILABLE') {
        const before = joined.substring(0, idx).trim();
        if (before.endsWith('outstanding')) {
          continue;
        }
      }
      matchedKeyword = keyword;
      matchIndex = idx;
      break;
    }
  }

  if (matchIndex !== -1) {
    // Scan forward from the end of the matched keyword
    const startIndex = matchIndex + matchedKeyword.length;
    const searchSlice = joined.substring(startIndex);

    // Look for "rs." in the remaining part of the message
    const rsIndex = searchSlice.indexOf('rs.');
    if (rsIndex !== -1) {
      const balanceStart = rsIndex + 3; // Skip past "rs."
      const balanceVal = extractBalance(searchSlice.substring(balanceStart));
      if (balanceVal !== null) {
        return balanceVal;
      }
    }
  }

  // Fallback: non-standard balance formats in the joined string
  return findNonStandardBalance(joined, keywords, type);
}

/**
 * Walks characters to accumulate a valid balance amount.
 * Stops at space, non-numeric character (except first decimal), or second decimal.
 */
function extractBalance(str: string): number | null {
  let result = '';
  let hasDecimal = false;
  const trimmed = str.trim();

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (char >= '0' && char <= '9') {
      result += char;
    } else if (char === '.') {
      if (hasDecimal) {
        break; // Stop at second decimal point
      }
      hasDecimal = true;
      result += char;
    } else if (char === ',') {
      continue; // Skip comma separators
    } else {
      break; // Stop at any other character
    }
  }

  if (result === '') return null;
  const val = parseFloat(result);
  return isNaN(val) ? null : val;
}

function findNonStandardBalance(joined: string, keywords: string[], type: 'AVAILABLE' | 'OUTSTANDING'): number | null {
  for (const keyword of keywords) {
    // Escape special characters in keywords
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // 1. Pattern: keyword followed by amount (e.g., "bal 1000.00")
    const regex1 = new RegExp(
      `(?:\\b${escapedKeyword}\\b|${escapedKeyword})\\s*(?:is\\s+)?(?:rs\\.?\\s*)?([\\d,]+(?:\\.\\d+)?)`,
      'i'
    );
    let match = joined.match(regex1);
    if (match) {
      const matchIndex = match.index ?? -1;
      if (type === 'AVAILABLE' && matchIndex > 0) {
        const before = joined.substring(0, matchIndex).trim();
        if (!before.endsWith('outstanding')) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(val)) return val;
        }
      } else {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) return val;
      }
    }

    // 2. Pattern: amount followed by keyword (e.g., "1000.00 available")
    const regex2 = new RegExp(
      `([\\d,]+(?:\\.\\d+)?)\\s*(?:rs\\.?\\s*)?(?:is\\s+)?(?:\\b${escapedKeyword}\\b|${escapedKeyword})`,
      'i'
    );
    match = joined.match(regex2);
    if (match) {
      const matchIndex = match.index ?? -1;
      if (type === 'AVAILABLE' && matchIndex > 0) {
        const before = joined.substring(0, matchIndex).trim();
        if (!before.endsWith('outstanding')) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(val)) return val;
        }
      } else {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) return val;
      }
    }
  }
  return null;
}
