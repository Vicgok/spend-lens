import { upiKeywords, upiHandles } from '../registry/keywords';

export interface ParsedMerchantInfo {
  merchant: string | null;
  referenceNo: string | null;
}

/**
 * Extracts merchant info and UPI reference number from the raw SMS message.
 * Fixes T5 by using word boundaries for UPI keywords.
 * Fixes U3 by enabling keyword-based merchant extraction (e.g., "spent at Swiggy").
 */
export function extractMerchantInfo(rawMessage: string): ParsedMerchantInfo {
  if (!rawMessage) {
    return { merchant: null, referenceNo: null };
  }

  const rawLower = rawMessage.toLowerCase();
  const rawTokens = rawMessage.split(/\s+/).filter(t => t !== '');
  const rawTokensLower = rawTokens.map(t => t.toLowerCase());

  let merchant: string | null = null;
  let referenceNo: string | null = null;

  // 1. VPA (Virtual Payment Address) Detection
  const vpaIndex = rawTokensLower.findIndex(t => t.includes('vpa'));
  if (vpaIndex !== -1) {
    const nextToken = vpaIndex + 1 < rawTokens.length ? rawTokens[vpaIndex + 1].replace(/[().,]/g, '') : '';
    const prevToken = vpaIndex > 0 ? rawTokens[vpaIndex - 1].replace(/[().,]/g, '') : '';

    if (nextToken.includes('@')) {
      const parts = nextToken.split('@');
      if (parts[0]) {
        merchant = parts[0];
      }
    } else if (prevToken.includes('@')) {
      const parts = prevToken.split('@');
      if (parts[0]) {
        merchant = parts[0];
      }
    } else {
      if (nextToken && !['upi', 'ref', 'no', 'is', 'at', 'to'].includes(nextToken.toLowerCase())) {
        merchant = nextToken;
      }
    }
  }

  // 2. UPI Keyword Scan
  // Find the LAST matching UPI keyword in the raw message string
  let lastKeyword = '';
  let lastKeywordIndex = -1;

  for (const keyword of upiKeywords) {
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Fix T5: Ensure word boundaries so "ref" doesn't match "reference"
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
    let match;
    while ((match = regex.exec(rawMessage)) !== null) {
      if (match.index > lastKeywordIndex) {
        lastKeywordIndex = match.index;
        lastKeyword = keyword;
      }
    }
  }

  if (lastKeywordIndex !== -1) {
    const afterKeyword = rawMessage.substring(lastKeywordIndex + lastKeyword.length).replace(/^[:=\-\/\s]+/, '').trim();
    const afterTokens = afterKeyword.split(/\s+/).filter(t => t !== '');

    if (afterTokens.length > 0) {
      let nextWord = afterTokens[0].replace(/[.,()]/g, '');
      
      // Skip prepositions (e.g. UPI to merchant@okaxis -> skip 'to')
      if (['to', 'at', 'from', 'for', 'via'].includes(nextWord.toLowerCase()) && afterTokens.length > 1) {
        nextWord = afterTokens[1].replace(/[.,()]/g, '');
      }

      const isNum = /^\d+$/.test(nextWord);

      if (isNum) {
        referenceNo = nextWord;
      } else {
        if (merchant) {
          // If merchant already found via VPA, extract longest numeric substring for referenceNo
          const numMatch = afterKeyword.match(/\b\d+\b/);
          if (numMatch) {
            referenceNo = numMatch[0];
          }
        } else {
          merchant = nextWord;
        }
      }
    }
  }

  // 3. UPI Handle Regex matching
  if (!merchant) {
    for (const token of rawTokens) {
      const cleanToken = token.replace(/[().,]/g, '');
      const atIndex = cleanToken.indexOf('@');
      if (atIndex !== -1) {
        const handle = cleanToken.substring(atIndex).toLowerCase();
        if (upiHandles.includes(handle)) {
          merchant = cleanToken.substring(0, atIndex);
          break;
        }
      }
    }
  }

  // 4. FIX U3: Keyword-based merchant extraction for non-UPI card/bank transactions
  if (!merchant) {
    const patterns = [
      /\bpaid\s+to\s+([A-Za-z0-9\s&.'-]+?)(?:\s+from|\s+on|\s+using|\s+ref|\s+avl|\s+bal|\.|$)/i,
      /\bspent\s+at\s+([A-Za-z0-9\s&.'-]+?)(?:\s+on|\s+using|\s+ref|\s+avl|\s+bal|\.|$)/i,
      /\bcharged\s+at\s+([A-Za-z0-9\s&.'-]+?)(?:\s+on|\s+using|\s+ref|\s+avl|\s+bal|\.|$)/i,
      /\bpurchase\s+at\s+([A-Za-z0-9\s&.'-]+?)(?:\s+on|\s+using|\s+ref|\s+avl|\s+bal|\.|$)/i,
      /\bspent\s+on\s+([A-Za-z0-9\s&.'-]+?)(?:\s+on|\s+using|\s+ref|\s+avl|\s+bal|\.|$)/i,
      /\btransfer\s+to\s+([A-Za-z0-9\s&.'-]+?)(?:\s+on|\s+using|\s+ref|\s+avl|\s+bal|\.|$)/i,
      /\b(?:at|to)\s+([A-Za-z0-9\s&.'-]+?)(?:\s+on|\s+ref|\s+upi|\.|$)/i // generic fallback
    ];

    for (const pattern of patterns) {
      const match = rawMessage.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Clean up common noise and restrict length
        const cleaned = candidate.replace(/\s+/g, ' ').trim();
        if (
          cleaned.length >= 2 &&
          cleaned.length <= 50 &&
          !/\b(?:rs|inr|avl|bal|a\/c|ac)\b/i.test(cleaned)
        ) {
          merchant = cleaned;
          break;
        }
      }
    }
  }

  // Clean up merchant name
  if (merchant) {
    // Strip UPI handle part if present in merchant name
    if (merchant.includes('@')) {
      merchant = merchant.split('@')[0];
    }
    // Strip leading/trailing punctuation and spaces
    merchant = merchant.replace(/^[.\s,-]+|[.\s,-]+$/g, '').trim();
    if (/^\d+$/.test(merchant) || merchant.length < 2 || merchant.length > 50) {
      merchant = null;
    }
  }

  // Clean up reference number
  if (referenceNo) {
    if (referenceNo.length < 4 || referenceNo.length > 20) {
      referenceNo = null;
    }
  }

  return { merchant, referenceNo };
}
