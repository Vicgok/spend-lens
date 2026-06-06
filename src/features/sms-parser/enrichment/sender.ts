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

  const cleaned = cleanSenderId(sender);

  // Map known Indian SMS sender patterns to predefined bank/wallet IDs
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

  let bankId = senderToBankIdMap[cleaned];

  // Try heuristic matching against predefined banks if not directly found
  if (!bankId) {
    const matchedBank = PREDEFINED_BANKS.find(bank => 
      cleaned.includes(bank.shortName.toUpperCase()) || 
      cleaned.includes(bank.id.toUpperCase())
    );
    if (matchedBank) {
      bankId = matchedBank.id;
    }
  }

  // Populate from predefined bank info
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

  // Fallback to checking constants lists for generic identification
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
