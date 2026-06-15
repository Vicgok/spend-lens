import React from 'react';
import { View, Text, StyleSheet} from 'react-native';
import Svg, { Circle, Rect, Path } from 'react-native-svg';

interface BankLogoProps {
  bankId: string;
  size?: number;
}

const BANK_LOGOS: Record<string, any> = {
  hdfc: require('../../../assets/icons_bank/HDFC.svg').default,
  sbi: require('../../../assets/icons_bank/SBI.svg').default,
  icici: require('../../../assets/icons_bank/ICICI.svg').default,
  axis: require('../../../assets/icons_bank/axis.svg').default,
  kotak: require('../../../assets/icons_bank/kotak.svg').default,
  pnb: require('../../../assets/icons_bank/PNB.svg').default,
  bob: require('../../../assets/icons_bank/Baroda.svg').default,
  canara: require('../../../assets/icons_bank/Canara.svg').default,
  union: require('../../../assets/icons_bank/Union.svg').default,
  indusind: require('../../../assets/icons_bank/Induslnd.svg').default,
  yesbank: require('../../../assets/icons_bank/Yes.svg').default,
  idfc: require('../../../assets/icons_bank/IDFC.svg').default,
  federal: require('../../../assets/icons_bank/Federal.svg').default,
};

export const BANK_BRAND_COLORS = {
  hdfc: { primary: '#004B8D', accent: '#ED1D24' },
  sbi: { primary: '#156DD1', accent: '#85B3E7' },
  icici: { primary: '#810000', accent: '#F34700' },
  axis: { primary: '#A92A5E', accent: '#B8517B' },
  kotak: { primary: '#EC1C24', accent: '#073B78' },
  pnb: { primary: '#9C0C3B', accent: '#F2BA00' },
  bob: { primary: '#FA5831', accent: '#002C6C' },
  canara: { primary: '#1BAFF0', accent: '#FDC000' },
  union: { primary: '#0B438C', accent: '#CA0715' },
  indusind: { primary: '#6D181C', accent: '#FFD700' },
  yesbank: { primary: '#005192', accent: '#C4261B' },
  idfc: { primary: '#9E1B26', accent: '#FFD700' },
  federal: { primary: '#0066B2', accent: '#FFD700' },
} as const;

/**
 * Professional letter-mark SVG logos for Indian banks and digital wallets.
 * Each logo uses the bank's brand colors and a distinctive visual treatment.
 */
export function BankLogo({ bankId, size = 32 }: BankLogoProps) {
  const SvgLogo = BANK_LOGOS[bankId];
  if (SvgLogo) {
    return (
      <SvgLogo
        width={size}
        height={size}
        style={{ borderRadius: size * 0.25 }}
      />
    );
  }

  switch (bankId) {
    // ─── HDFC Bank ──────────────────────────────────────────
    case 'hdfc':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#004C8F" />
          <Path d="M8 8h3v16H8V8z M13 14h6v3h-6v-3z M21 8h3v16h-3V8z" fill="#FFFFFF" />
        </Svg>
      );

    // ─── SBI ────────────────────────────────────────────────
    case 'sbi':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Circle cx="16" cy="16" r="16" fill="#0038A8" />
          <Circle cx="16" cy="16" r="7" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <Circle cx="16" cy="16" r="3" fill="#FFFFFF" />
          <Path d="M16 5v6M16 21v6M5 16h6M21 16h6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // ─── ICICI Bank ─────────────────────────────────────────
    case 'icici':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#B02A30" />
          <Path d="M6 8h3v16H6z M12 8h3v16h-3z M18 14a4 4 0 1 1 0 8h-1v-8h1z M23 8h3v16h-3z" fill="#FFFFFF" />
        </Svg>
      );

    // ─── Axis Bank ──────────────────────────────────────────
    case 'axis':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#800020" />
          <Path d="M10 24l6-16 6 16" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12.5 18h7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // ─── Kotak Mahindra ─────────────────────────────────────
    case 'kotak':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#EC1C24" />
          <Path d="M9 8h3v7l7-7h4l-8 8 8 8h-4l-7-7v7H9V8z" fill="#FFFFFF" />
        </Svg>
      );

    // ─── PNB ────────────────────────────────────────────────
    case 'pnb':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#7B2D26" />
          <Path d="M7 24V8h5a5 5 0 0 1 0 10H10" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M19 8v16M19 8l6 16" fill="none" stroke="#F7C948" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    // ─── Bank of Baroda ─────────────────────────────────────
    case 'bob':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#F47A20" />
          <Path d="M8 8h5a5 5 0 0 1 0 10H8V8z" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="22" cy="16" r="5" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
        </Svg>
      );

    // ─── Canara Bank ────────────────────────────────────────
    case 'canara':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#0054A6" />
          <Path d="M10 12a6 6 0 0 1 12 0" fill="none" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
          <Path d="M10 20a6 6 0 0 0 12 0" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </Svg>
      );

    // ─── Union Bank ─────────────────────────────────────────
    case 'union':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#0072BC" />
          <Path d="M10 8v10a6 6 0 0 0 12 0V8" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="16" cy="26" r="1.5" fill="#FF6600" />
        </Svg>
      );

    // ─── IndusInd Bank ──────────────────────────────────────
    case 'indusind':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#842224" />
          <Path d="M16 6v20" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          <Path d="M11 10l5 4 5-4" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    // ─── Yes Bank ───────────────────────────────────────────
    case 'yesbank':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#005EA6" />
          <Path d="M10 10l4 6v8" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M22 10l-4 6" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="23" cy="22" r="2.5" fill="#32CD32" />
        </Svg>
      );

    // ─── IDFC First Bank ────────────────────────────────────
    case 'idfc':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#9E1B26" />
          <Path d="M16 6l8 12H8l8-12z" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
          <Circle cx="16" cy="24" r="2" fill="#FFD700" />
        </Svg>
      );

    // ─── Federal Bank ───────────────────────────────────────
    case 'federal':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#0066B2" />
          <Path d="M10 8h12M10 15h9M10 22h12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M10 8v16" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" />
        </Svg>
      );

    // ─── Paytm ──────────────────────────────────────────────
    case 'paytm':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#00B9F1" />
          <Path d="M8 10h6a4 4 0 0 1 0 8H8V10z" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M20 10h4v4h-4" fill="none" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M22 14v8" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // ─── Google Pay ─────────────────────────────────────────
    case 'gpay':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#FFFFFF" />
          <Path d="M6 16.5l3-5h4l-3 5" fill="#4285F4" />
          <Path d="M10 11.5h4l3 5h-4" fill="#EA4335" />
          <Path d="M13 16.5h4l3 5h-4" fill="#FBBC05" />
          <Path d="M16 21.5h4l3-5h-4" fill="#34A853" />
          <Path d="M24 11h-4a5 5 0 0 0 0 10h4" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // ─── PhonePe ────────────────────────────────────────────
    case 'phonepe':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect width="32" height="32" rx="8" fill="#5F259F" />
          <Path d="M12 8v16" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M12 8h5a5 5 0 0 1 0 10h-5" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M20 14l2-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );

    // ─── Fallback: styled initial letter ────────────────────
    default:
      return null;
  }
}

// ─── Account Type Icons (for generic non-bank accounts) ────
const ACCOUNT_TYPE_ICONS: Record<string, { bg: string; label: string }> = {
  cash: { bg: '#2ECC71', label: '₹' },
  credit_card: { bg: '#E74C3C', label: 'CC' },
  wallet: { bg: '#9B59B6', label: 'W' },
  bank: { bg: '#3498DB', label: 'B' },
};

interface AccountIconProps {
  bankId?: string | null;
  accountType?: string;
  icon?: string | null;
  color?: string | null;
  size?: number;
}

/**
 * Unified account icon component.
 * Shows SVG bank logo for known banks, or a styled lettermark for generic account types.
 */
export function AccountIcon({ bankId, accountType, color, size = 32 }: AccountIconProps) {
  // If we have a known bank ID, render the SVG logo
  if (bankId) {
    const logo = <BankLogo bankId={bankId} size={size} />;
    if (logo) return logo;
  }

  // Fallback: styled lettermark for account type
  const typeInfo = ACCOUNT_TYPE_ICONS[accountType || 'bank'];
  const bgColor = color || typeInfo?.bg || '#6C5CE7';
  const label = typeInfo?.label || '₹';
  const fontSize = size * 0.4;

  return (
    <View style={[styles.lettermark, { width: size, height: size, borderRadius: size * 0.25, backgroundColor: bgColor }]}>
      <Text style={[styles.lettermarkText, { fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lettermark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lettermarkText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
