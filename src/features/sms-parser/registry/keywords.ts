export interface CombinedWord {
  pattern: RegExp;
  replacement: string;
  type: 'CARD' | 'WALLET' | 'ACCOUNT';
}

export const combinedWords: CombinedWord[] = [
  { pattern: /credit card/gi, replacement: 'c_card', type: 'CARD' },
  { pattern: /amazon pay/gi, replacement: 'amazon_pay', type: 'WALLET' },
  { pattern: /uni card/gi, replacement: 'uni_card', type: 'CARD' },
  { pattern: /niyo card/gi, replacement: 'niyo', type: 'ACCOUNT' },
  { pattern: /slice\s*(?:credit|credt)?\s*card/gi, replacement: 'slice_card', type: 'CARD' },
  { pattern: /one\s*(?:credit|credt)?\s*card/gi, replacement: 'one_card', type: 'CARD' },
];

export const wallets = [
  'paytm',
  'simpl',
  'lazypay',
  'amazon_pay',
  'phonepe',
  'gpay',
  'cred',
  'mobikwik',
  'freecharge',
  'olamoney',
  'slice',
  'jupiter',
  'fi'
];

export const upiHandles = [
  '@barodampay',
  '@rbl',
  '@idbi',
  '@upi',
  '@aubank',
  '@axisbank',
  '@bandhan',
  '@dlb',
  '@indus',
  '@kbl',
  '@federal',
  '@sbi',
  '@uco',
  '@citi',
  '@citigold',
  '@dbs',
  '@freecharge',
  '@okhdfcbank',
  '@okaxis',
  '@oksbi',
  '@okicici',
  '@yesg',
  '@hsbc',
  '@icici',
  '@indianbank',
  '@allbank',
  '@kotak',
  '@ikwik',
  '@unionbankofindia',
  '@uboi',
  '@unionbank',
  '@paytm',
  '@ybl',
  '@axl',
  '@ibl',
  '@sib',
  '@yespay'
];

export const upiKeywords = [
  'upi ref no',
  'upi ref',
  'ref no',
  'upi',
  'ref'
];

export const availableBalanceKeywords = [
  'avbl bal',
  'available balance',
  'available limit',
  'available credit limit',
  'avbl. credit limit',
  'limit available',
  'a/c bal',
  'ac bal',
  'available bal',
  'avl bal',
  'updated balance',
  'total balance',
  'new balance',
  'bal',
  'avl lmt',
  'available'
];

export const outstandingBalanceKeywords = [
  'outstanding'
];

// Transaction type matching patterns
export const debitPattern = /\b(?:debited|debit|deducted|withdrawn|withdrawal|withdrew)\b/i;

export const miscDebitPattern = /\b(?:payment|spent|paid|used|charged|transaction|tran|booked|purchased|sent|purchase|using|txn|declined|failed|pending)\b/i;

export const creditPattern = /\b(?:credited|credit|deposited|added|received|refund|repayment)\b/i;
