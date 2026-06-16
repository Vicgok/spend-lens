export const APP_NAME = 'SpendLens';
export const APP_TAGLINE = 'See where your money goes';
export const APP_VERSION = '1.0.0';

export const DEFAULT_CURRENCY = 'INR';
export const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const ONBOARDING_COPY = {
  noBankLoginRequired: 'No bank login required',
  continue: 'Continue',
  enableSmsTracking: 'Enable SMS Tracking',
  setupInProgress: 'Setting up...',
  startTracking: 'Start Tracking',
  addAnotherAccount: 'Add another account',
} as const;

export const ACCOUNTS_SCREEN_COPY = {
  userControlPanel: 'USER CONTROL PANEL',
  manageAccounts: 'Manage Accounts',
  manageAccountsSubtitle: 'Add and manage your accounts to track your net worth better.',
  currentAccounts: 'CURRENT ACCOUNTS',
  addNewAccount: 'ADD NEW ACCOUNT',
  bankAccount: 'Bank Account',
  creditCard: 'Credit Card',
  digitalWallet: 'Digital Wallet',
  bankAccountDescription: 'Add savings or current accounts.',
  creditCardDescription: 'Track card spending and repayments.',
  digitalWalletDescription: 'Track UPI and wallet balances.',
  privacyTitle: 'Your Data Stays With You',
  privacyPoints: ['Data stored locally', 'No cloud sync', 'No bank login required', 'Full user control'],
  noteTitle: 'Account Updates',
  noteText: 'Balances and transactions update automatically through SMS parsing.',
  startingBalance: 'Enter Starting Balance',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving...',
} as const;

export const ACCOUNTS_SCREEN_COLORS = {
  background: '#E1D7C2',
  surface: '#FFF8EE',
  primary: '#745143',
  secondary: '#54554B',
  green: '#3E5A2A',
  lightGreen: '#EEF4E6',
  border: '#E8DDD0',
} as const;

// How many months of history free users can see
export const FREE_TIER_HISTORY_MONTHS = 6;

// Onboarding storage key
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'spendlens_onboarding_complete',
  THEME_MODE: 'spendlens_theme_mode',
  DEFAULT_CURRENCY: 'spendlens_default_currency',
  SETTINGS: 'spendlens_settings',
} as const;

// SMS sender IDs for Indian banks (common patterns)
export const BANK_SENDER_IDS = {
  india: [
    'HDFCBK', 'SBIINB', 'ICICIB', 'AXISBK', 'KOTAKB',
    'IABORB', 'YESBNK', 'PNBSMS', 'CANBNK', 'BOIIND',
    'UCOBNK', 'INDBNK', 'FEDERL', 'CENTBK', 'SCBANK',
    'PAYTM', 'PYTM1', 'JIOPAY', 'GPAY', 'PHONEPE',
    'AMEXIN', 'CITIBK', 'HSBCIN', 'RBLBNK', 'IDFCFB',
  ],
  us: [
    'CHASE', 'BOFA', 'WELLSF', 'CITI', 'CAPONE',
    'AMEX', 'DISCVR', 'USBK',
  ],
  generic: [
    'BANK', 'CREDIT', 'DEBIT', 'ALERT',
  ],
};
