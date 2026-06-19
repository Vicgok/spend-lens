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
    const merchant = (parsed.transaction.merchant || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const accountLast4 = parsed.account.number || '';
    const transactionType = parsed.transaction.type;
    
    // Extract yyyyMMdd from parsed.date or date parameter
    const dStr = parsed.date || date;
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
