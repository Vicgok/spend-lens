import { BANK_SENDER_IDS } from '../../../lib/constants';
import { PREDEFINED_BANKS } from '../../../lib/banks';

export interface ParsedSenderInfo {
  isKnownBank: boolean;
  bankId: string | null;
  bankName: string | null;
  accountType: 'bank' | 'wallet' | null;
}

/**
 * Strips carrier/regional headers from SMS sender IDs (e.g., "AD-HDFCBK" -> "HDFCBK").
 */
export function cleanSenderId(sender: string): string {
  if (!sender) return '';
  const cleaned = sender.toUpperCase().trim();
  // Strip typical Indian SMS provider prefixes (e.g., AX-HDFCBK)
  const match = cleaned.match(/^[A-Z]{2}-([A-Z0-9]+)$/);
  if (match) {
    return match[1];
  }
  return cleaned;
}

/**
 * Normalizes user-input, sender info or body text to predefined bank IDs.
 * Strictly ignores UPI IDs, VPAs, transaction refs or account numbers.
 */
export function normalizeBankName(input: string): string | null {
  if (!input) return null;
  const cleaned = input.toLowerCase().trim();

  // Rule 1: Ignore if it looks like VPA / UPI handle (contains @)
  if (cleaned.includes('@')) {
    return null;
  }

  // Rule 1: Ignore if it contains transaction reference or account numbers (e.g., digits with hyphen, or starts with 4+ digits)
  if (/\b\d+-|-\d+\b/.test(cleaned) || /^[0-9\-]+$/.test(cleaned)) {
    return null;
  }
  if (/^\d{4,}/.test(cleaned)) {
    return null;
  }

  // Priority 1: Exact senderId matches (6-letter sender IDs after cleaning prefix)
  const sender = cleanSenderId(input).toUpperCase();
  
  const senderToBankIdMap: Record<string, string> = {
    HDFCBK: 'hdfc',
    SBIINB: 'sbi',
    ICICIB: 'icici',
    AXISBK: 'axis',
    KOTAKB: 'kotak',
    PNBSMS: 'pnb',
    BOIIND: 'bob',
    CANBNK: 'canara',
    UCOBNK: 'union',
    INDBNK: 'indusind',
    FEDERL: 'federal',
    YESBNK: 'yesbank',
    IDFCFB: 'idfc',
    PAYTM: 'paytm',
    PYTM1: 'paytm',
    GPAY: 'gpay',
    PHONEPE: 'phonepe',
  };

  if (senderToBankIdMap[sender]) {
    return senderToBankIdMap[sender];
  }

  // Priority 2: Known bank keywords matching
  const keywordsMap: Record<string, string> = {
    icici: 'icici',
    hdfc: 'hdfc',
    sbi: 'sbi',
    axis: 'axis',
    kotak: 'kotak',
    idfc: 'idfc',
    federal: 'federal',
    yesbank: 'yesbank',
    yes: 'yesbank',
    indusind: 'indusind',
    pnb: 'pnb',
    bob: 'bob',
    canara: 'canara',
    union: 'union',
    paytm: 'paytm',
    gpay: 'gpay',
    phonepe: 'phonepe'
  };

  // Split cleaned text to find word boundary matches
  const cleanText = cleaned.replace(/[^a-z0-9\s]/g, ' ');
  const words = cleanText.split(/\s+/);

  for (const word of words) {
    if (keywordsMap[word]) {
      return keywordsMap[word];
    }
  }

  // Fallback: Check if any keyword matches as a word in the string via regex
  for (const keyword of Object.keys(keywordsMap)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(cleaned)) {
      return keywordsMap[keyword];
    }
  }

  return null;
}

/**
 * Maps the sender ID to a known predefined bank or wallet in the SpendLens DB.
 * Addresses U2 from reference.
 */
export function identifyBankFromSender(sender: string): ParsedSenderInfo {
  const result: ParsedSenderInfo = {
    isKnownBank: false,
    bankId: null,
    bankName: null,
    accountType: null
  };

  if (!sender) return result;

  // Utilize the new normalizeBankName helper
  const bankId = normalizeBankName(sender);

  // Populate from predefined bank info if found
  if (bankId) {
    const bank = PREDEFINED_BANKS.find(b => b.id === bankId);
    if (bank) {
      result.isKnownBank = true;
      result.bankId = bank.id;
      result.bankName = bank.name;
      result.accountType = bank.type;
      return result;
    }
  }

  // Fallback to checking constants lists for generic identification (e.g. US banks)
  const cleaned = cleanSenderId(sender);
  const allKnownSenders = [
    ...BANK_SENDER_IDS.india,
    ...BANK_SENDER_IDS.us,
    ...BANK_SENDER_IDS.generic
  ];

  if (allKnownSenders.includes(cleaned)) {
    result.isKnownBank = true;
    if (cleaned === 'CHASE') {
      result.bankName = 'Chase Bank';
      result.accountType = 'bank';
    } else if (cleaned === 'BOFA') {
      result.bankName = 'Bank of America';
      result.accountType = 'bank';
    } else if (cleaned === 'AMEX') {
      result.bankName = 'American Express';
      result.accountType = 'bank';
    } else {
      result.bankName = cleaned;
      result.accountType = 'bank';
    }
  }

  return result;
}
