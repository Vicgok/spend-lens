import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect, Circle, Ellipse, Line } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { BANK_BRAND_COLORS, AccountIcon } from './BankLogo';
import { formatCurrency } from '@/utils/currency';
import { Account } from '@/types';
import { typography } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  surface: '#FFF8EE',
  primary: '#745143',
  secondary: '#54554B',
  green: '#3E5A2A',
  lightGreen: '#EEF4E6',
  border: '#E8DDD0',
};

// ─── CUSTOM PREMIUM ICONS ──────────────────────────────────────────────────

const CardWalletIcon = React.memo(({ color, size = 18 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth={2.2} />
    <Path d="M16 10h5v4h-5z" fill={color} stroke={color} strokeWidth={1} />
    <Circle cx="18" cy="12" r="1.2" fill="#FFFFFF" />
  </Svg>
));

const CardBankIcon = React.memo(({ color, size = 18 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9.5L12 4l9 5.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 20h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M3 20h18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Line x1="7" y1="12" x2="7" y2="18" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    <Line x1="12" y1="12" x2="12" y2="18" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    <Line x1="17" y1="12" x2="17" y2="18" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    <Line x1="5" y1="9.5" x2="19" y2="9.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
));

// ─── DYNAMIC LEAF SVG ILLUSTRATION ─────────────────────────────────────────

const CardLeafSVG = React.memo(({
  strokeColor,
  fillColor,
  stemColor,
  groundColor,
  opacity = 0.25,
}: {
  strokeColor: string;
  fillColor: string;
  stemColor: string;
  groundColor?: string;
  opacity?: number;
}) => (
  <View style={[styles.leafContainer, { opacity }]} pointerEvents="none">
    <Svg width={90} height={66} viewBox="0 0 65 48" fill="none">
      <Path
        d="M54 47C54 36 53 27 55 18C56 13 58 9 61 5"
        stroke={stemColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Ellipse
        cx="50"
        cy="26"
        rx="4"
        ry="8"
        transform="rotate(-35 50 26)"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <Ellipse
        cx="56"
        cy="16"
        rx="5.5"
        ry="12"
        transform="rotate(15 56 16)"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <Ellipse
        cx="63"
        cy="23"
        rx="4"
        ry="9"
        transform="rotate(28 63 23)"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
      />
      {groundColor ? (
        <Path
          d="M40 47H65"
          stroke={groundColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  </View>
));

// ─── DETAILED THEMING AND MOCK HELPERS ──────────────────────────────────────



const getCardTheme = (account: Account) => {
  const bankId = account.bankId;
  const brandColors = bankId && bankId in BANK_BRAND_COLORS
    ? BANK_BRAND_COLORS[bankId as keyof typeof BANK_BRAND_COLORS]
    : undefined;

  if (brandColors) {
    return {
      primary: brandColors.primary,
      accent: brandColors.accent,
      textColor: '#FFF8EE',
      subTextColor: 'rgba(255, 248, 238, 0.75)',
      iconBg: '#FFF8EE',
      iconColor: brandColors.primary,
      IconComponent: account.type === 'bank' ? CardBankIcon : CardWalletIcon,
      leafColors: {
        strokeColor: '#FFF8EE',
        fillColor: 'rgba(255, 248, 238, 0.1)',
        stemColor: '#FFF8EE',
        opacity: 0.12,
      },
      dividerColor: 'rgba(255, 248, 238, 0.15)',
      borderColor: brandColors.primary,
      removeBtnBorderColor: '#FFF8EE',
      removeBtnTextColor: '#FFF8EE',
      isDark: true,
    };
  }

  const nameLower = account.name.toLowerCase();

  // 1. Brown Theme: SBI Credit Card or generic credit card
  if (nameLower.includes('sbi') || account.type === 'credit_card') {
    return {
      primary: '#754533',
      accent: '#C5B5A8',
      textColor: '#FFF8EE',
      subTextColor: '#C5B5A8',
      iconBg: '#FFF8EE',
      iconColor: '#754533',
      IconComponent: CardWalletIcon,
      leafColors: {
        strokeColor: '#FFF8EE',
        fillColor: 'rgba(255, 248, 238, 0.1)',
        stemColor: '#FFF8EE',
        opacity: 0.12,
      },
      dividerColor: 'rgba(255, 248, 238, 0.12)',
      borderColor: '#522F22',
      removeBtnBorderColor: '#FFF8EE',
      removeBtnTextColor: '#FFF8EE',
      isDark: true,
    };
  }

  // 2. Green Theme: HDFC Bank or generic savings bank account
  if (nameLower.includes('hdfc') || account.type === 'bank') {
    return {
      primary: '#4E653E',
      accent: '#B5C8AE',
      textColor: '#FFF8EE',
      subTextColor: '#B5C8AE',
      iconBg: '#FFF8EE',
      iconColor: '#4E653E',
      IconComponent: CardBankIcon,
      leafColors: {
        strokeColor: '#FFF8EE',
        fillColor: 'rgba(255, 248, 238, 0.1)',
        stemColor: '#FFF8EE',
        opacity: 0.12,
      },
      dividerColor: 'rgba(255, 248, 238, 0.12)',
      borderColor: '#324528',
      removeBtnBorderColor: '#FFF8EE',
      removeBtnTextColor: '#FFF8EE',
      isDark: true,
    };
  }

  // 3. Cream Theme: Axis Bank or generic wallets/cash
  return {
    primary: '#FFF8EE',
    accent: '#EEF4E6',
    textColor: '#3E5A2A',
    subTextColor: '#745143',
    iconBg: '#EEF4E6',
    iconColor: '#3E5A2A',
    IconComponent: CardWalletIcon,
    leafColors: {
      strokeColor: '#9B9469',
      fillColor: '#D8D4A8',
      stemColor: '#6E7B4B',
      groundColor: '#E8DDD0',
      opacity: 0.45,
    },
    dividerColor: '#E8DDD0',
    borderColor: '#E8DDD0',
    removeBtnBorderColor: '#E67E65',
    removeBtnTextColor: '#E67E65',
    isDark: false,
  };
};

export interface CurrentAccountsListProps {
  accounts: Account[];
  selectedAccountId: string | null;
  onSelectAccountId: (id: string) => void;
  onDeleteAccount?: (account: Account) => void;
  onPressActive?: (account: Account) => void;
  userName?: string;
}

interface AccountCardProps {
  account: Account;
  visualIdx: number;
  visibleAccountsLength: number;
  STACK_OFFSET: number;
  onSelectAccountId: (id: string) => void;
  onDeleteAccount?: (account: Account) => void;
  onPressActive?: (account: Account) => void;
  userName?: string;
}

const AccountCard = memo(({
  account,
  visualIdx,
  visibleAccountsLength,
  STACK_OFFSET,
  onSelectAccountId,
  onDeleteAccount,
  onPressActive,
  userName,
}: AccountCardProps) => {
  const isActive = visualIdx === 0;
  const cardZIndex = isActive ? 10 : (visibleAccountsLength - visualIdx);
  const targetTranslateY = (visibleAccountsLength - 1 - visualIdx) * STACK_OFFSET;

  const theme = getCardTheme(account);
  const typeLabel = account.type === 'bank'
    ? 'SAVINGS ACCOUNT'
    : account.type === 'credit_card'
      ? 'CREDIT CARD'
      : account.type === 'wallet'
        ? 'DIGITAL WALLET'
        : 'CASH ACCOUNT';

  // Layout state configurations
  const paddingVertical = isActive ? 18 : 8;
  const iconSize = isActive ? 38 : 28;
  const fontSize = isActive ? 17 : 14;
  const typeSize = isActive ? 11 : 9;

  const pressedScale = useSharedValue(1);
  const translateX = useSharedValue(0);

  // When a card becomes active, slide it out horizontally and then back in
  React.useEffect(() => {
    if (isActive) {
      translateX.value = withSequence(
        withTiming(80, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) })
      );
    } else {
      translateX.value = 0;
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(targetTranslateY, {
            damping: 120, // reduced bouncy time
            stiffness: 700, // faster settling
          }),
        },
        {
          translateX: translateX.value,
        },
        {
          scale: withSpring(pressedScale.value, {
            damping: 120,
            stiffness: 900,
          }),
        },
      ],
      shadowOpacity: withTiming(isActive ? 0.1 : 0.06, { duration: 350 }),
      shadowRadius: withTiming(isActive ? 10 : 5, { duration: 350 }),
      elevation: withTiming(isActive ? 5 : 3, { duration: 350 }),
    };
  }, [targetTranslateY, isActive]);

  const animatedFooterStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isActive ? 1 : 0, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
      }),
    };
  }, [isActive]);

  return (
    <AnimatedPressable
      onPressIn={() => {
        pressedScale.value = 0.95; // scale down on press
      }}
      onPressOut={() => {
        pressedScale.value = 1; // scale back on release
      }}
      onPress={() => {
        if (isActive) {
          if (onPressActive) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPressActive(account);
          }
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSelectAccountId(account.id);
        }
      }}
      style={[
        styles.card,
        {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          borderColor: theme.borderColor,
          zIndex: cardZIndex,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[theme.primary, theme.primary, theme.accent, theme.accent]}
        locations={[0, 0.7, 0.7, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <CardLeafSVG {...theme.leafColors} />

      {/* Header info */}
      <View style={[styles.headerPart, { paddingTop: paddingVertical, paddingBottom: paddingVertical }]} pointerEvents="none">
        <AccountIcon
          bankId={account.bankId}
          accountType={account.type}
          size={iconSize}
        />
        <View style={styles.textCol}>
          <Text style={[styles.nameText, { color: theme.textColor, fontSize }]} numberOfLines={1}>
            {account.name}
          </Text>
          <Text style={[styles.typeText, { color: theme.subTextColor, fontSize: typeSize }]} numberOfLines={1}>
            {typeLabel}
          </Text>
        </View>
        <View style={styles.amountCol}>
          <Text style={[styles.amountText, { color: theme.textColor, fontSize }]} numberOfLines={1}>
            {formatCurrency(account.balance)}
          </Text>
        </View>
      </View>

      {/* Footer containing remove options and masked card numbers */}
      <Animated.View
        style={[styles.footerWrap, animatedFooterStyle]}
        pointerEvents={isActive ? 'auto' : 'none'}
      >
        <View style={[styles.cardDivider, { backgroundColor: theme.dividerColor }]} />
        <View style={styles.footerPart}>
          <Text style={[styles.userNameText, { color: theme.subTextColor }]} numberOfLines={1}>
            {userName}
          </Text>
          {onDeleteAccount ? (
            <Pressable
              onPress={() => onDeleteAccount(account)}
              style={({ pressed }) => [
                styles.removeBtn,
                { borderColor: theme.removeBtnBorderColor },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.removeBtnText, { color: theme.removeBtnTextColor }]}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
});

AccountCard.displayName = 'AccountCard';

export const CurrentAccountsList = memo(({
  accounts,
  selectedAccountId,
  onSelectAccountId,
  onDeleteAccount,
  onPressActive,
  userName = 'USER NAME',
}: CurrentAccountsListProps) => {
  if (accounts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No accounts connected yet.</Text>
      </View>
    );
  }

  // Cyclic stack rotation sorting logic
  const activeSelectedId = selectedAccountId || accounts[0]?.id || null;
  let orderedAccounts = [...accounts];
  if (activeSelectedId) {
    const selectedIdx = orderedAccounts.findIndex((a) => a.id === activeSelectedId);
    if (selectedIdx > -1) {
      const before = orderedAccounts.slice(0, selectedIdx);
      const after = orderedAccounts.slice(selectedIdx);
      orderedAccounts = [...after, ...before];
    }
  }

  const visibleAccounts = orderedAccounts.slice(0, 3);
  const behindCount = Math.max(0, visibleAccounts.length - 1);
  const STACK_OFFSET = 36;
  const deckHeight = 140 + behindCount * STACK_OFFSET;

  // Render stable list ordered by original IDs to prevent swap mounting
  const stableAccounts = [...visibleAccounts].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <View style={[styles.cardDeck, { height: deckHeight }]}>
      {stableAccounts.map((account) => {
        // Find current position in visual stack
        const visualIdx = orderedAccounts.findIndex((a) => a.id === account.id);
        if (visualIdx === -1) return null;

        return (
          <AccountCard
            key={account.id}
            account={account}
            visualIdx={visualIdx}
            visibleAccountsLength={visibleAccounts.length}
            STACK_OFFSET={STACK_OFFSET}
            onSelectAccountId={onSelectAccountId}
            onDeleteAccount={onDeleteAccount}
            onPressActive={onPressActive}
            userName={userName}
          />
        );
      })}
    </View>
  );
});

CurrentAccountsList.displayName = 'CurrentAccountsList';

const styles = StyleSheet.create({
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: COLORS.secondary,
  },
  cardDeck: {
    position: 'relative',
    width: '100%',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
  },
  headerPart: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  textCol: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  amountCol: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  nameText: {
    fontFamily: typography.fontFamily.bold,
  },
  typeText: {
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  amountText: {
    fontFamily: typography.fontFamily.monoBold,
  },
  cardDivider: {
    height: 1,
    width: '100%',
  },
  footerWrap: {
    width: '100%',
  },
  footerPart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
  },
  userNameText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  removeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  removeBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  leafContainer: {
    position: 'absolute',
    right: 0,
    bottom: -8,
    zIndex: 0,
  },
});

export default CurrentAccountsList;
