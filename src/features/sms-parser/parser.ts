import { TransactionType } from '../../types';

export interface ParsedSMS {
  type: TransactionType;
  amount: number;
  merchant: string | null;
  balance: number | null;
  date: string;
  accountInfo: string | null;
  rawBody: string;
}

interface SMSTemplate {
  name: string;
  senderPattern: RegExp;
  patterns: {
    debit: RegExp[];
    credit: RegExp[];
  };
  amountPattern: RegExp;
  merchantPattern?: RegExp;
  balancePattern?: RegExp;
  accountPattern?: RegExp;
}

// ---- Indian Bank Templates ----

const indianTemplates: SMSTemplate[] = [
  {
    name: 'Generic Indian Bank Debit/Credit',
    senderPattern: /^[A-Z]{2}-[A-Z]+|^[A-Z]{6,}/i,
    patterns: {
      debit: [
        /debited.*?(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
        /(?:rs\.?|inr)\s*([\d,]+\.?\d*)\s*(?:has been |was )?debited/i,
        /sent\s+(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
        /paid\s+(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
        /purchase.*?(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
        /withdrawn.*?(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
        /spent\s+(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
      ],
      credit: [
        /credited.*?(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
        /(?:rs\.?|inr)\s*([\d,]+\.?\d*)\s*(?:has been |was )?credited/i,
        /received\s+(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
        /refund.*?(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
        /cashback.*?(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
      ],
    },
    amountPattern: /(?:rs\.?|inr)\s*([\d,]+\.?\d*)/i,
    merchantPattern: /(?:at|to|for|from|@)\s+([A-Za-z0-9\s&.'-]+?)(?:\s+on|\s+ref|\s+upi|\.|$)/i,
    balancePattern: /(?:bal|balance|avl bal|avbl bal|available)\s*(?:is|:)?\s*(?:rs\.?|inr)?\s*([\d,]+\.?\d*)/i,
    accountPattern: /(?:a\/c|acct?|account|card|xx)[\s*]*(\d{4})/i,
  },
];

// ---- US Bank Templates ----

const usTemplates: SMSTemplate[] = [
  {
    name: 'Generic US Bank',
    senderPattern: /^[A-Z]{5,}/i,
    patterns: {
      debit: [
        /(?:purchase|charge|debit|payment|withdrawal).*?\$\s*([\d,]+\.?\d*)/i,
        /\$\s*([\d,]+\.?\d*)\s*(?:was |has been )?(?:charged|debited|spent|purchased)/i,
        /(?:spent|paid|sent)\s*\$\s*([\d,]+\.?\d*)/i,
      ],
      credit: [
        /(?:deposit|credit|refund|received).*?\$\s*([\d,]+\.?\d*)/i,
        /\$\s*([\d,]+\.?\d*)\s*(?:was |has been )?(?:deposited|credited|received)/i,
      ],
    },
    amountPattern: /\$\s*([\d,]+\.?\d*)/i,
    merchantPattern: /(?:at|to|from|for)\s+([A-Za-z0-9\s&.'-]+?)(?:\s+on|\s+ending|\.|$)/i,
    balancePattern: /(?:bal|balance|available)\s*:?\s*\$\s*([\d,]+\.?\d*)/i,
    accountPattern: /(?:ending|acct|account|card)\s*(?:in|#)?\s*(\d{4})/i,
  },
];

/**
 * Parse a single SMS message body and extract transaction data.
 * Returns null if the SMS doesn't appear to be a financial transaction.
 */
export function parseSMS(body: string, date: string): ParsedSMS | null {
  const allTemplates = [...indianTemplates, ...usTemplates];

  for (const template of allTemplates) {
    // Try debit patterns first
    for (const pattern of template.patterns.debit) {
      const match = body.match(pattern);
      if (match) {
        return extractTransactionData(body, date, 'expense', template);
      }
    }

    // Try credit patterns
    for (const pattern of template.patterns.credit) {
      const match = body.match(pattern);
      if (match) {
        return extractTransactionData(body, date, 'income', template);
      }
    }
  }

  return null; // Not a financial SMS
}

function extractTransactionData(
  body: string,
  date: string,
  type: TransactionType,
  template: SMSTemplate
): ParsedSMS | null {
  // Extract amount
  const amountMatch = body.match(template.amountPattern);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // Extract merchant
  let merchant: string | null = null;
  if (template.merchantPattern) {
    const merchantMatch = body.match(template.merchantPattern);
    if (merchantMatch) {
      merchant = merchantMatch[1].trim();
      // Clean up merchant name
      merchant = merchant.replace(/\s+/g, ' ').trim();
      if (merchant.length < 2 || merchant.length > 50) {
        merchant = null;
      }
    }
  }

  // Extract balance
  let balance: number | null = null;
  if (template.balancePattern) {
    const balanceMatch = body.match(template.balancePattern);
    if (balanceMatch) {
      balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
      if (isNaN(balance)) balance = null;
    }
  }

  // Extract account info
  let accountInfo: string | null = null;
  if (template.accountPattern) {
    const accountMatch = body.match(template.accountPattern);
    if (accountMatch) {
      accountInfo = `XX${accountMatch[1]}`;
    }
  }

  return {
    type,
    amount,
    merchant,
    balance,
    date,
    accountInfo,
    rawBody: body,
  };
}

/**
 * Generate a hash from SMS content for deduplication.
 */
export function generateSMSHash(body: string, date: string): string {
  // Simple hash based on body content and date
  const content = `${body.trim().toLowerCase()}|${date}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return `sms_${Math.abs(hash).toString(36)}`;
}

/**
 * Check if an SMS body looks like a financial transaction message.
 * Quick pre-filter to avoid expensive parsing on non-financial SMS.
 */
export function isFinancialSMS(body: string): boolean {
  const financialKeywords = [
    /(?:rs\.?|inr|\$|usd)\s*[\d,]+/i,
    /debited|credited|withdrawn|deposited|purchase|refund|payment/i,
    /a\/c|acct|account|card\s+\w*\d{4}/i,
    /balance|avl bal|avbl/i,
    /upi|neft|imps|rtgs/i,
  ];

  return financialKeywords.some((pattern) => pattern.test(body));
}
