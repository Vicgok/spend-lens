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
