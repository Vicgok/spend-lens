export interface PredefinedBank {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  type: 'bank' | 'wallet';
}

export const PREDEFINED_BANKS: PredefinedBank[] = [
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    shortName: 'HDFC',
    icon: '🏦',
    color: '#004C8F',
    type: 'bank',
  },
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    icon: '🏛️',
    color: '#00BFFF',
    type: 'bank',
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    shortName: 'ICICI',
    icon: '🦁',
    color: '#FF8C00',
    type: 'bank',
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    shortName: 'AXIS',
    icon: '📈',
    color: '#800020',
    type: 'bank',
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'KOTAK',
    icon: '👑',
    color: '#EC1C24',
    type: 'bank',
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    icon: '🌾',
    color: '#A30000',
    type: 'bank',
  },
  {
    id: 'bob',
    name: 'Bank of Baroda',
    shortName: 'BOB',
    icon: '☀️',
    color: '#F47A20',
    type: 'bank',
  },
  {
    id: 'canara',
    name: 'Canara Bank',
    shortName: 'CANARA',
    icon: '📐',
    color: '#0054A6',
    type: 'bank',
  },
  {
    id: 'union',
    name: 'Union Bank of India',
    shortName: 'UNION',
    icon: '🤝',
    color: '#0072BC',
    type: 'bank',
  },
  {
    id: 'indusind',
    name: 'IndusInd Bank',
    shortName: 'INDUSIND',
    icon: '🐂',
    color: '#842224',
    type: 'bank',
  },
  {
    id: 'yesbank',
    name: 'Yes Bank',
    shortName: 'YES',
    icon: '✔️',
    color: '#005EA6',
    type: 'bank',
  },
  {
    id: 'idfc',
    name: 'IDFC First Bank',
    shortName: 'IDFC',
    icon: '⭐',
    color: '#9E1B26',
    type: 'bank',
  },
  {
    id: 'federal',
    name: 'Federal Bank',
    shortName: 'FED',
    icon: '🦅',
    color: '#0066B2',
    type: 'bank',
  },
  {
    id: 'paytm',
    name: 'Paytm Payments Bank',
    shortName: 'PAYTM',
    icon: '👛',
    color: '#00B9F1',
    type: 'wallet',
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    shortName: 'GPAY',
    icon: '📱',
    color: '#4285F4',
    type: 'wallet',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    shortName: 'PHONEPE',
    icon: '💜',
    color: '#5F259F',
    type: 'wallet',
  },
];

export function getBankById(id: string): PredefinedBank | undefined {
  return PREDEFINED_BANKS.find(b => b.id === id);
}

export function getBankByShortName(shortName: string): PredefinedBank | undefined {
  const normalized = shortName.toUpperCase();
  return PREDEFINED_BANKS.find(b => normalized.includes(b.shortName));
}
