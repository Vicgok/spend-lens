import { ParsedTransaction } from './types';
import { normalizeSMS } from './core/normalizer';
import { isValidTransaction } from './core/validator';
import { getTransactionAmount } from './extractors/amount';
import { getAccount } from './extractors/account';
import { getBalance } from './extractors/balance';
import { getTransactionType } from './extractors/type';
import { extractMerchantInfo } from './extractors/merchant';
import { extractTransactionDate } from './extractors/date';
import { getReferenceNumber } from './extractors/reference';
import { identifyBankFromSender } from './enrichment/sender';
import { getConfidenceScore } from './enrichment/confidence';

/**
 * Main SMS parsing entry point.
 * Parses a raw SMS text body into a structured ParsedTransaction output.
 * Returns null if the SMS does not qualify as a financial transaction.
 */
export function parseTransactionSMS(
  body: string,
  receivedDate: string,
  sender?: string
): ParsedTransaction | null {
  if (!body || typeof body !== 'string' || body.trim() === '') {
    return null;
  }

  // Early ignore guard for failed/declined/pending/mandate messages
  const ignorePatterns = [
    /\bdeclined due to insufficient limit\b/i,
    /\bpending\.\s*please wait\b/i,
    /\bfailed transaction alert\b/i,
    /\bcould not be debited\b/i,
    /\bmandate registration\b/i,
    /\bnot a debit\b/i,
  ];

  const exceptionPatterns = [
    /\breversed if debited\b/i,
    /\brefund\b/i,
    /\breversal\b/i,
  ];


  const matchesIgnore = ignorePatterns.some(pattern => pattern.test(body));
  const matchesException = exceptionPatterns.some(pattern => pattern.test(body));

  if (matchesIgnore && !matchesException) {
    return null;
  }


  // 1. Normalize and tokenize raw body once (FIX T13)
  const tokens = normalizeSMS(body);
  if (tokens.length === 0) {
    return null;
  }

  // 2. Extract core fields
  const account = getAccount(tokens);
  
  // Post-extraction entity normalization
  if (account.name === 'Amazon Pay' || account.name === 'amazon pay') {
    account.name = 'amazon';
  }

  const availableBalance = getBalance(tokens, 'AVAILABLE');
  const amount = getTransactionAmount(tokens);

  // 3. Extract merchant & reference info (runs on raw body, needed for validation)
  const merchantInfo = extractMerchantInfo(body);
  let merchant = merchantInfo.merchant;
  let referenceNo = merchantInfo.referenceNo;

  // Fallback reference number extractor (FIX T5)
  if (!referenceNo) {
    referenceNo = getReferenceNumber(body);
  }

  // 4. Validation Gate (mandatory amount + at least one other field) (FIX T2)
  const isValid = isValidTransaction(amount, availableBalance, account.number, referenceNo, merchant);
  if (!isValid) {
    return null;
  }

  // 5. Extract transaction type (only valid transactions have type)
  const type = getTransactionType(tokens);
  if (!type) {
    return null; // Ignore if it has no clear debit/credit classification (e.g. OTPs)
  }

  // 6. Extract outstanding balance (only for credit cards)
  let outstandingBalance: number | null = null;
  if (account.type === 'CARD') {
    outstandingBalance = getBalance(tokens, 'OUTSTANDING');
  }

  // 7. Extract transaction date/time
  const date = extractTransactionDate(body, receivedDate);

  // 8. Enrich with sender bank metadata if sender is provided
  let isKnownBank = false;
  if (sender) {
    const senderInfo = identifyBankFromSender(sender);
    isKnownBank = senderInfo.isKnownBank;
    
    // Fill missing account fields from sender information only if we have explicit digits
    if (account.number && !account.name && senderInfo.bankName) {
      account.name = senderInfo.bankName;
    }
    if (account.number && !account.type && senderInfo.accountType) {
      account.type = senderInfo.accountType === 'wallet' ? 'WALLET' : 'ACCOUNT';
    }
  }

  // 9. Score parse confidence
  const confidence = getConfidenceScore(
    amount,
    availableBalance,
    account.number,
    type,
    merchant,
    date,
    isKnownBank
  );

  // 10. Assemble structured output
  return {
    account,
    balance: {
      available: availableBalance,
      outstanding: outstandingBalance,
    },
    transaction: {
      type,
      amount,
      merchant,
      referenceNo,
    },
    date,
    confidence,
    rawBody: body,
  };
}

function extractDedupeMerchantFromRaw(body: string): string {
  const patterns = [
    /\bvia\s+(?:simpl|lazypay|lazy\s+pay|paylater|pay\s+later|bnpl|amazon\s+pay\s+later|flipkart\s+pay\s+later)\s+at\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on|from|using|ref|bal|repay)|\.|$)/i,
    /\bvia\s+(?:simpl|lazypay|lazy\s+pay|paylater|pay\s+later|bnpl|amazon\s+pay\s+later|flipkart\s+pay\s+later)\s+to\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on|from|using|ref|bal|repay)|\.|$)/i,
    /\bpaid\s+(?:rs\.?\s*[\d,.]+|inr\s*[\d,.]+)?\s*to\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:from|using|on|via|ref|bal|repay)|\.|$)/i,
    /\bspent\s+(?:rs\.?\s*[\d,.]+|inr\s*[\d,.]+)?\s*at\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on|from|using|ref|bal|repay)|\.|$)/i,
    /\bspent\s+(?:rs\.?\s*[\d,.]+|inr\s*[\d,.]+)?\s*via\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:due|ref|bal(?:ance)?|repay)|\.|$)/i,
    /\bpurchase\s+(?:of\s+rs\.?\s*[\d,.]+|of\s+inr\s*[\d,.]+)?\s*at\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on|from|using|ref|bal|repay)|\.|$)/i,
    /\bcharged\s+(?:rs\.?\s*[\d,.]+|inr\s*[\d,.]+)?\s*at\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on|from|using|ref|bal|repay)|\.|$)/i,
    /\b(?:towards|for)\s+(?:upi\/)?([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on|from|using|ref|bal|repay)|\.|$)/i,
    /\btransfer\s+(?:of\s+rs\.?\s*[\d,.]+|of\s+inr\s*[\d,.]+)?\s*to\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on|from|using|ref|bal|repay)|\.|$)/i,
    /\b(?:via|by)\s+(?:neft|imps|rtgs|upi|si|ecs)?\s*[-:\s]\s*([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on|from|using|ref|bal|repay)|\.|$)/i,
    /\bat\s+([A-Za-z0-9\s&.'-]+?)(?=\s+(?:on|from|using|ref|bal|repay)|\.|$)/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate && candidate.length >= 2 && !/^(?:upi|ref|txn|payment|transaction|bal|balance)$/i.test(candidate)) {
        return candidate;
      }
    }
  }
  return '';
}

function normalizeDedupeMerchant(merchant: string | null | undefined, body?: string): string {
  let m = merchant || '';
  const genericMerchants = new Set(['id', 'txn', 'upi', 'ref', 'no', 'payment', 'transaction', 'bank', 'debit', 'credit']);
  if ((!m || genericMerchants.has(m.toLowerCase().trim()) || /^bnpl\d*$/i.test(m.trim())) && body) {
    const extracted = extractDedupeMerchantFromRaw(body);
    if (extracted) {
      m = extracted;
    }
  }

  if (!m) return '';

  let normalized = m
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');

  normalized = normalized.replace(/\b(pvt|ltd|limited|private|india|online|payments|payment|upi)\b/g, ' ');
  normalized = normalized.replace(/\b(simpl|lazypay|lazy pay|paylater|pay later|bnpl)\b/g, ' ');
  normalized = normalized.replace(/india$/g, ' ');

  return normalized.replace(/\s+/g, '').trim();
}

function getFallbackEntropyToken(body: string, parsed?: ParsedTransaction | null): string {
  // Extract reference-like pattern (e.g. UPI Ref / Txn ID)
  const refMatch = body.match(/\b(?:ref|refno|ref\s*no|txn|txn\s*id|transaction\s*id|upi\s*ref|rrn)\b[-:\s]*([A-Za-z0-9]+)/i);
  if (refMatch && refMatch[1]) {
    return refMatch[1].toLowerCase();
  }
  // Try to find any sequence of 4 or more digits
  const numbers = body.match(/\b\d{4,}\b/g);
  if (numbers && numbers.length > 0) {
    return numbers.join('-');
  }
  // Use account name if available
  if (parsed && parsed.account && parsed.account.name) {
    return parsed.account.name.toLowerCase().replace(/\s+/g, '');
  }
  // Fallback to first word of the message
  const words = body.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().split(/\s+/);
  if (words.length > 0) {
    return words[0];
  }
  return 'none';
}

/**
 * Generates a stable hash from SMS content for deduplication.
 */
export function generateSMSHash(
  body: string,
  date: string,
  parsed?: ParsedTransaction | null
): string {
  let content = '';

  if (parsed && parsed.transaction.amount && parsed.transaction.type) {
    const amount = parsed.transaction.amount;
    const transactionType = parsed.transaction.type;
    const dStr = parsed.date || date;
    const merchant = parsed.transaction.merchant || '';
    const accountLast4 = parsed.account.number || '';

    let yyyyMMdd = '';
    if (dStr) {
      const datePart = dStr.split('T')[0];
      if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        yyyyMMdd = datePart.replace(/-/g, '');
      } else {
        try {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            yyyyMMdd = `${year}${month}${day}`;
          }
        } catch (_) {}
      }
    }
    content = `${amount}|${merchant}|${accountLast4}|${transactionType}|${yyyyMMdd}`;
  } else {
    // Clean body text fallback
    let cleanBody = body.toLowerCase().trim();
    // Remove common prefixes
    cleanBody = cleanBody.replace(/^(alert|dear customer|transaction alert|notification|notice|msg|msg_id)(:\s*|,\s*|\s+)/i, '');
    cleanBody = cleanBody.replace(/\s+/g, ' ');

    let yyyyMMdd = '';
    if (date) {
      const datePart = date.split('T')[0];
      if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        yyyyMMdd = datePart.replace(/-/g, '');
      } else {
        try {
          const d = new Date(date);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            yyyyMMdd = `${year}${month}${day}`;
          }
        } catch (_) {}
      }
    }
    content = `${cleanBody}|${yyyyMMdd}`;
  }

  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return `sms_${Math.abs(hash).toString(36)}`;
}

export interface TransactionInput {
  body: string;
  date: string;
  parsed: ParsedTransaction | null;
}

export interface DedupeGroupResult {
  canonical: TransactionInput;
  duplicates: TransactionInput[];
  groupKey: string;
}

export function areTransactionsDuplicate(a: TransactionInput, b: TransactionInput): boolean {
  if (!a.parsed || !b.parsed) {
    return false;
  }

  const timeA = new Date(a.parsed.date || a.date).getTime();
  const timeB = new Date(b.parsed.date || b.date).getTime();
  const timeDiffMin = Math.abs(timeA - timeB) / 60000;
  if (timeDiffMin > 5) return false;

  // 1. Same valid referenceNo => duplicate
  const refA = a.parsed.transaction.referenceNo && !/^(?:bnpl\d*|alert|txn|id|ref|upi|payment|transaction|msg|msg_id)$/i.test(a.parsed.transaction.referenceNo.trim())
    ? a.parsed.transaction.referenceNo.trim().toLowerCase()
    : null;
  const refB = b.parsed.transaction.referenceNo && !/^(?:bnpl\d*|alert|txn|id|ref|upi|payment|transaction|msg|msg_id)$/i.test(b.parsed.transaction.referenceNo.trim())
    ? b.parsed.transaction.referenceNo.trim().toLowerCase()
    : null;

  if (refA && refB && refA === refB) {
    return true;
  }
  // 1a. Both have valid but different reference numbers => definitely not a duplicate
  if (refA && refB && refA !== refB) {
    return false;
  }

  // 2. Different explicit account numbers => not duplicate unless bridge case
  const accA = a.parsed.account.number || '';
  const accB = b.parsed.account.number || '';
  const typeA = a.parsed.account.type;
  const typeB = b.parsed.account.type;
  
  const hasBridgeA = /(?:simpl|lazypay|lazy\s+pay|paylater|pay\s+later|bnpl|amazon\s+pay\s+later|flipkart\s+pay\s+later|wallet|card)/i.test(a.body);
  const hasBridgeB = /(?:simpl|lazypay|lazy\s+pay|paylater|pay\s+later|bnpl|amazon\s+pay\s+later|flipkart\s+pay\s+later|wallet|card)/i.test(b.body);
  
  const isA_Bridge = hasBridgeA || typeA === 'WALLET' || typeA === 'CARD';
  const isB_Bridge = hasBridgeB || typeB === 'WALLET' || typeB === 'CARD';
  
  // Cross-type bridge: one side is wallet/card/bridge wording and the other side is a bank account (ACCOUNT)
  const isBridgeCase = (isA_Bridge && typeB === 'ACCOUNT') || (isB_Bridge && typeA === 'ACCOUNT');

  if (accA && accB && accA !== accB) {
    if (!isBridgeCase) {
      return false;
    }
  }

  // 3. Missing account non-bridge => not duplicate unless referenceNo matches
  if ((!accA || !accB) && !isBridgeCase) {
    if (refA || refB) {
      return refA === refB;
    }
    return false;
  }

  // 4. BNPL/wallet/card bridge allowed only when merchant/amount/time strongly match
  if (isBridgeCase) {
    const amtA = a.parsed.transaction.amount || 0;
    const amtB = b.parsed.transaction.amount || 0;
    if (amtA !== amtB) return false;

    const typeA_tx = a.parsed.transaction.type;
    const typeB_tx = b.parsed.transaction.type;
    if (typeA_tx !== typeB_tx) return false;

    const merchA = normalizeDedupeMerchant(a.parsed.transaction.merchant, a.body);
    const merchB = normalizeDedupeMerchant(b.parsed.transaction.merchant, b.body);
    if (merchA !== merchB) return false;

    return true;
  }

  // 5. Same account + same amount + same merchant + time within ±5m => duplicate
  if (accA && accB && accA === accB) {
    return true;
  }

  return false;
}

export function dedupeTransactions(transactions: TransactionInput[]): DedupeGroupResult[] {
  // Sort deterministically by timestamp, with stable tie-breakers
  const sorted = [...transactions].sort((a, b) => {
    const timeA = a.parsed ? new Date(a.parsed.date || a.date).getTime() : new Date(a.date).getTime();
    const timeB = b.parsed ? new Date(b.parsed.date || b.date).getTime() : new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    const refA = (a.parsed && a.parsed.transaction.referenceNo) || '';
    const refB = (b.parsed && b.parsed.transaction.referenceNo) || '';
    if (refA !== refB) return refA.localeCompare(refB);
    if (a.body.length !== b.body.length) return a.body.length - b.body.length;
    return a.body.localeCompare(b.body);
  });

  // Group by Stage 1 Candidate Key: amount | type | normalizedMerchant | yyyyMMdd
  const buckets = new Map<string, typeof sorted>();
  for (const tx of sorted) {
    if (!tx.parsed) continue;
    const amount = tx.parsed.transaction.amount || 0;
    const type = tx.parsed.transaction.type || 'debit';
    const normMerchant = normalizeDedupeMerchant(tx.parsed.transaction.merchant, tx.body);
    const dStr = tx.parsed.date || tx.date;
    let yyyyMMdd = '19700101';
    if (dStr) {
      const datePart = dStr.split('T')[0];
      if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        yyyyMMdd = datePart.replace(/-/g, '');
      } else {
        try {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            yyyyMMdd = `${year}${month}${day}`;
          }
        } catch (_) {}
      }
    }
    const key = `${amount}|${type}|${normMerchant}|${yyyyMMdd}`;
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(tx);
  }

  const finalGroups: DedupeGroupResult[] = [];

  for (const [_, bucketTxs] of buckets.entries()) {
    const bucketGroups: DedupeGroupResult[] = [];
    for (const tx of bucketTxs) {
      let matchedGroup: DedupeGroupResult | null = null;
      for (const bg of bucketGroups) {
        if (areTransactionsDuplicate(tx, bg.canonical)) {
          matchedGroup = bg;
          break;
        }
      }
      if (matchedGroup) {
        matchedGroup.duplicates.push(tx);
      } else {
        const hashVal = generateSMSHash(tx.body, tx.date, tx.parsed);
        const canonicalTimeMs = tx.parsed
          ? new Date(tx.parsed.date || tx.date).getTime()
          : new Date(tx.date).getTime();
        // Make groupKey unique per group: append canonical timestamp so two groups
        // with identical legacy hashes are not confused by the evaluator.
        const uniqueGroupKey = `${hashVal}_t${canonicalTimeMs}`;
        bucketGroups.push({
          canonical: tx,
          duplicates: [],
          groupKey: uniqueGroupKey,
        });
      }
    }
    finalGroups.push(...bucketGroups);
  }

  return finalGroups;
}
