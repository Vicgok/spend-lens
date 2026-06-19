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

  const rawTokens = rawMessage.split(/\s+/).filter(t => t !== '');
  const rawTokensLower = rawTokens.map(t => t.toLowerCase());

  let merchant: string | null = null;
  let referenceNo: string | null = null;

  // Special early override for salary credits
  if (rawMessage.toLowerCase().startsWith('salary credit')) {
    merchant = 'salary';
  }

  // 1. VPA (Virtual Payment Address) Detection
  if (!merchant) {
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
      let nextWordIdx = 0;
      const skipWords = ['payment', 'transaction', 'transfer', 'mandate', 'debit', 'credit', 'ref', 'no', 'to', 'at', 'from', 'for', 'via', 'of', 'rs', 'inr', 'setup', 'registration'];
      let hasPreposition = false;
      while (
        nextWordIdx < afterTokens.length &&
        skipWords.includes(afterTokens[nextWordIdx].replace(/[.,()]/g, '').toLowerCase())
      ) {
        const word = afterTokens[nextWordIdx].replace(/[.,()]/g, '').toLowerCase();
        if (['to', 'at', 'from', 'for', 'via'].includes(word)) {
          hasPreposition = true;
        }
        nextWordIdx++;
      }

      if (nextWordIdx < afterTokens.length) {
        const nextWord = afterTokens[nextWordIdx].replace(/[.,()]/g, '');
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
          } else if (!hasPreposition) {
            merchant = nextWord;
          }
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

  // 4. Keyword-based merchant extraction for non-UPI card/bank transactions
  if (!merchant) {
    const patterns = [
      /\bpaid\s+to\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i,
      /\bspent\s+at\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i,
      /\bcharged\s+at\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i,
      /\bpurchase\s+at\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i,
      /\bspent\s+on\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i,
      /\btransfer\s+to\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i,
      /\brefund\s+(?:from|for)\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i,
      /\bcredited\s+by\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i,
      /\b(?:received|credited|cashback)\s+from\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i,
      /\b(?:towards|for|by|at|to|from|as)\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on\b|from\b|using\b|ref\b|upi\s+(?:ref|mandate|setup|transaction)\b|failed\b|declined\b|is\b|was\b|to\b|at\b|for\b|by\b|towards\b|bal(?:ance)?\b(?:\s*(?:rs\.?|inr\.?|limit|\d)))|\.|$)/i
    ];

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags + 'g');
      let match;
      while ((match = regex.exec(rawMessage)) !== null) {
        if (match[1]) {
          const candidate = match[1].trim();
          let cleaned = candidate.replace(/\s+/g, ' ').trim();
          
          // Clean prefix before rejection filters
          cleaned = cleaned.replace(/^(?:nach|neft|imps|rtgs|upi|si|ecs)\s*[-:]\s*/gi, '');

          if (
            cleaned.length >= 2 &&
            cleaned.length <= 50 &&
            !/\b(?:rs|inr|avl|bal|balance|a\/c|ac|account|wallet|limit|payment|transaction|withdrawal|withdrawn|neft|imps|rtgs|upi|nach|si|ecs|mandate|verification|failed|declined|refund|salary)\b/i.test(cleaned) &&
            !/\bcard\b.*\d/i.test(cleaned)
          ) {
            merchant = cleaned;
            break;
          }
        }
      }
      if (merchant) break;
    }
  }

  // Clean up merchant name
  if (merchant) {
    // Strip UPI handle part if present in merchant name
    if (merchant.includes('@')) {
      merchant = merchant.split('@')[0];
    }
    // Strip prefixes like NEFT-, NACH-, etc.
    merchant = merchant.replace(/^(?:nach|neft|imps|rtgs|upi|si|ecs)\s*[-:]\s*/gi, '');

    // Strip corporate suffixes
    merchant = merchant.replace(/\s+(?:limited|ltd|pvt|private)\b.*$/i, '').trim();

    // Strip credit/debit suffixes
    merchant = merchant.replace(/\s+(?:credit|debit)\b.*$/i, '').trim();

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
