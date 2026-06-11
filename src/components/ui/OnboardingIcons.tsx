import React from 'react';
import Svg, { Rect, Circle, Path, Line } from 'react-native-svg';

interface IconProps {
  color: string;
  size?: number;
}

// 📅 -> Bill due / Calendar
export const CalendarIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth={1.8} />
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth={1.8} />
    <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx="8" cy="13" r="1" fill={color} />
    <Circle cx="12" cy="13" r="1" fill={color} />
    <Circle cx="16" cy="13" r="1" fill={color} />
    <Circle cx="8" cy="17" r="1" fill={color} />
    <Circle cx="12" cy="17" r="1" fill={color} />
  </Svg>
));

// 🔄 -> Subscription / Refresh / Recur
export const RefreshIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12a9 9 0 11-2.7-6.3L21 8"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 3v5h-5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// 🛡️ -> Protected / Shield
export const ShieldIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 11l2 2 4-4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// 🔒 -> Lock
export const LockIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth={1.8} />
    <Path
      d="M8 11V7a4 4 0 018 0v4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// ⬆ -> Salary / Arrow Up
export const ArrowUpIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 19V5M5 12l7-7 7 7"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// ◎ -> All Clear / Check Circle
export const CheckCircleIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// 📈 -> Spending Up / Graph
export const GraphUpIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 20h18M3 16l6-6 4 4 8-8"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// 🏦 -> Bank
export const BankIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 22h18M5 10v10M9 10v10M15 10v10M19 10v10M12 2L3 7h18L12 2z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
));

// 💵 -> Cash
export const CashIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth={1.8} />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.8} />
    <Path d="M6 9h.01M18 15h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
));

// 💳 -> Credit Card
export const CreditCardIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth={1.8} />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={1.8} />
    <Rect x="6" y="14" width="4" height="2" rx="0.5" fill={color} />
  </Svg>
));

// 📱 -> Digital Wallet / Phone
export const WalletIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth={1.8} />
    <Line x1="11" y1="19" x2="13" y2="19" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
));

// 💰 -> Money Bag
export const MoneyBagIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
    <Path d="M12 7v10M10 9h3.5a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3H14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
));

// 🔍 -> Search
export const SearchIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="6" stroke={color} strokeWidth={1.8} />
    <Path d="M16 16l5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
));

// ◀ -> Back Arrow
export const BackArrowIcon = React.memo(({ color, size = 18 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));
