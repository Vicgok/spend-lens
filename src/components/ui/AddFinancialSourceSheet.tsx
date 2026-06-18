import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  SafeAreaView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { BaseBottomSheet, shellStyles } from './BaseBottomSheet';
import Svg, { Path, Rect, Circle} from 'react-native-svg';

import { tokens } from '@/theme';
import type { AccountType } from '@/types';
import { PREDEFINED_BANKS } from '@/lib/banks';
import { NotebookIllustration, CornerPlant, BankLogo } from './index';

const { colors, radii, spacing, type: t } = tokens;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DEFAULT_HEIGHT = SCREEN_HEIGHT * 0.73;
const EXTENDED_HEIGHT = SCREEN_HEIGHT * 0.94;

export interface AddFinancialSourcePayload {
  type: AccountType;
  bankId?: string;
  startingBalance: number;
}

export interface AddFinancialSourceSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: AddFinancialSourcePayload) => void;
  disabledTypes?: AccountType[];
  existingBankIds?: string[];
  initialBalance?: number;
}

interface IconProps {
  size?: number;
  color?: string;
}

const CloseIcon = ({ size = 20, color = colors.textPrimary }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

const SearchIcon = ({ size = 18, color = colors.textSecondary }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={11} cy={11} r={8} />
    <Path d="M21 21l-4.3-4.3" />
  </Svg>
);

const ChevronDownIcon = ({ size = 18, color = colors.textSecondary }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

const CheckIcon = ({ size = 16, color = colors.white }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const ShieldCheckIcon = ({ size = 32, color = colors.forest }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="M9 11l2 2 4-4" />
  </Svg>
);

const BankIcon = React.memo(({ size = 44 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M6 18 L24 8 L42 18 Z"
      fill={colors.forestSoft}
      stroke={colors.iconOutline}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
    <Rect x={5} y={18} width={38} height={3} rx={1} fill={colors.forestSoft} stroke={colors.iconOutline} strokeWidth={1.4} />
    {[10, 18, 26, 34].map(x => (
      <Rect key={x} x={x} y={22} width={4} height={14} fill={colors.cardBg} stroke={colors.iconOutline} strokeWidth={1.4} />
    ))}
    <Rect x={5} y={37} width={38} height={4} rx={1} fill={colors.forestSoft} stroke={colors.iconOutline} strokeWidth={1.4} />
    <Circle cx={24} cy={15} r={1.2} fill={colors.iconOutline} />
  </Svg>
));

const WalletIcon = React.memo(({ size = 44 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M8 16 C8 13 10 11 13 11 H34 C37 11 39 13 39 16 V35 C39 37 37 39 35 39 H11 C9 39 8 37 8 35 Z"
      fill={colors.walletBrown}
      stroke={colors.iconOutline}
      strokeWidth={1.6}
    />
    <Path
      d="M8 18 H32 C34 18 36 20 36 22 V26 C36 28 34 30 32 30 H8 Z"
      fill={colors.walletDark}
      stroke={colors.iconOutline}
      strokeWidth={1.6}
    />
    <Circle cx={31} cy={24} r={1.8} fill={colors.cardYellow} stroke={colors.iconOutline} strokeWidth={1.2} />
  </Svg>
));

const CardIcon = React.memo(({ size = 44 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect
      x={5}
      y={12}
      width={38}
      height={26}
      rx={4}
      fill={colors.cardYellow}
      stroke={colors.iconOutline}
      strokeWidth={1.6}
    />
    <Rect x={5} y={18} width={38} height={5} fill={colors.cardStripe} />
    <Rect x={10} y={28} width={10} height={3} rx={1} fill={colors.iconOutline} opacity={0.55} />
    <Rect x={10} y={32} width={16} height={2} rx={1} fill={colors.iconOutline} opacity={0.45} />
    <Circle cx={36} cy={32} r={2.2} fill={colors.cardBg} stroke={colors.iconOutline} strokeWidth={1.2} />
  </Svg>
));

const CashIcon = React.memo(({ size = 44 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Rect x={6} y={14} width={34} height={20} rx={3} fill={colors.cashGreenDark} stroke={colors.iconOutline} strokeWidth={1.4} />
    <Rect x={9} y={17} width={34} height={20} rx={3} fill={colors.cashGreen} stroke={colors.iconOutline} strokeWidth={1.6} />
    <Rect x={12} y={20} width={28} height={14} rx={2} fill="none" stroke={colors.cashGreenDark} strokeWidth={1} opacity={0.6} />
    <Circle cx={26} cy={27} r={4.2} fill={colors.cardBg} stroke={colors.iconOutline} strokeWidth={1.2} />
    <Path
      d="M24 25 H28 M24 27 H28 M24 25 C26.5 25 26.5 29 24 29 L28 31"
      stroke={colors.rupeeRed}
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
));

const CheckMark = React.memo(({ size = 14, color = colors.surface }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path
      d="M3.5 8.5 L6.5 11.5 L12.5 5"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
));

const RadioDot = ({ selected }: { selected: boolean }) => (
  <View
    style={[
      styles.radioOuter,
      selected && styles.radioOuterSelected,
    ]}
  >
    {selected && <View style={styles.radioInner} />}
  </View>
);

const ACCOUNT_TYPES: {
  id: AccountType;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
}[] = [
    { id: 'bank', label: 'Bank', Icon: BankIcon },
    { id: 'wallet', label: 'Wallet', Icon: WalletIcon },
    { id: 'credit_card', label: 'Card', Icon: CardIcon },
    { id: 'cash', label: 'Cash', Icon: CashIcon },
  ];

function formatINR(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  // Indian grouping: last 3, then groups of 2
  const n = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return rest ? `${grouped},${n}` : n;
}

export const AddFinancialSourceSheet: React.FC<AddFinancialSourceSheetProps> = ({
  visible,
  onClose,
  onCreate,
  disabledTypes = ['cash'],
  existingBankIds = [],
  initialBalance = 0,
}) => {
  const [selectedType, setSelectedType] = useState<AccountType>('bank');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [balance, setBalance] = useState<string>(
    initialBalance === 0 ? '' : formatINR(String(initialBalance))
  );
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  // Animated height for the bottom drawer
  const sheetHeight = useRef(new Animated.Value(DEFAULT_HEIGHT)).current;
  const currentHeightRef = useRef(DEFAULT_HEIGHT);
  const startHeightRef = useRef(DEFAULT_HEIGHT);

  useEffect(() => {
    const listenerId = sheetHeight.addListener(({ value }) => {
      currentHeightRef.current = value;
    });
    return () => {
      sheetHeight.removeListener(listenerId);
    };
  }, [sheetHeight]);

  useEffect(() => {
    if (visible) {
      sheetHeight.setValue(DEFAULT_HEIGHT);
      currentHeightRef.current = DEFAULT_HEIGHT;
    }
  }, [visible, sheetHeight]);

  // PanResponder to allow native extending / dragging from the top mid handle bar
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, // Start dragging immediately on handle bar touch
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      startHeightRef.current = currentHeightRef.current || DEFAULT_HEIGHT;
    },
    onPanResponderMove: (_evt, gestureState) => {
      // Calculate new height based on starting height and vertical delta dy
      const newHeight = startHeightRef.current - gestureState.dy;
      if (newHeight >= SCREEN_HEIGHT * 0.30 && newHeight <= SCREEN_HEIGHT * 0.96) {
        sheetHeight.setValue(newHeight);
        currentHeightRef.current = newHeight;
      }
    },
    onPanResponderRelease: (_evt, gestureState) => {
      // If it was a simple tap / touch without actual drag, do nothing (prevents snapping)
      if (Math.abs(gestureState.dy) < 5) {
        return;
      }

      const currentHeight = startHeightRef.current - gestureState.dy;
      if (gestureState.dy > 120) {
        // Dragged down far enough -> close drawer
        onClose();
        Animated.spring(sheetHeight, {
          toValue: DEFAULT_HEIGHT,
          useNativeDriver: false,
        }).start(() => {
          currentHeightRef.current = DEFAULT_HEIGHT;
        });
      } else if (currentHeight > DEFAULT_HEIGHT + 60 || gestureState.dy < -50) {
        // Dragged up -> extend sheet to top
        Animated.spring(sheetHeight, {
          toValue: EXTENDED_HEIGHT,
          useNativeDriver: false,
        }).start(() => {
          currentHeightRef.current = EXTENDED_HEIGHT;
        });
      } else if (currentHeight < DEFAULT_HEIGHT - 60) {
        // Dragged down too much -> close
        onClose();
        Animated.spring(sheetHeight, {
          toValue: DEFAULT_HEIGHT,
          useNativeDriver: false,
        }).start(() => {
          currentHeightRef.current = DEFAULT_HEIGHT;
        });
      } else {
        // Reset to default
        Animated.spring(sheetHeight, {
          toValue: DEFAULT_HEIGHT,
          useNativeDriver: false,
        }).start(() => {
          currentHeightRef.current = DEFAULT_HEIGHT;
        });
      }
    }
  }), [onClose, sheetHeight]);

  // Reset selected provider and dropdown status when account type switches
  useEffect(() => {
    const typeBanks = PREDEFINED_BANKS.filter(b => b.type === selectedType && !existingBankIds.includes(b.id));
    if (typeBanks.length > 0) {
      setSelectedBankId(typeBanks[0].id);
    } else {
      setSelectedBankId('');
    }
    setQuery('');
    setIsBankDropdownOpen(false);
  }, [selectedType, existingBankIds]);

  const filteredBanks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const typeFiltered = PREDEFINED_BANKS.filter(b => b.type === selectedType);
    const available = typeFiltered.filter(b => !existingBankIds.includes(b.id));

    if (!q) return available;
    return available.filter(b => b.name.toLowerCase().includes(q));
  }, [selectedType, existingBankIds, query]);



  const numericBalance = useMemo(
    () => Number(balance.replace(/,/g, '')) || 0,
    [balance],
  );

  const isProviderType = selectedType === 'bank' || selectedType === 'wallet';
  const canCreate =
    numericBalance >= 0 && (!isProviderType || !!selectedBankId);

  const handleCreate = useCallback(() => {
    if (!canCreate) return;
    onCreate({
      type: selectedType,
      bankId: isProviderType ? selectedBankId : undefined,
      startingBalance: numericBalance,
    });
  }, [canCreate, numericBalance, onCreate, selectedBankId, selectedType, isProviderType]);

  return (
    <BaseBottomSheet visible={visible} onClose={onClose}>
          <Animated.View style={[shellStyles.sheet, { height: sheetHeight }]}>
            {/* Draggable handle bar — panHandlers stay here, visual tokens from shellStyles */}
            <View {...panResponder.panHandlers} style={shellStyles.handleContainer}>
              <View style={shellStyles.handle} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              overScrollMode="never"
            >
              {/* Header */}
              <View style={shellStyles.header}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={[t.title, { fontSize: 24, fontWeight: '700', color: colors.textPrimary, lineHeight: 30 }]}>Add Financial Source</Text>
                  <Text style={[t.subtitle, { marginTop: spacing.xs, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }]}>
                    Choose a type and add a new place for your money.
                  </Text>
                </View>
                <View style={styles.mascotWrap} pointerEvents="none">
                  <NotebookIllustration />
                </View>
              </View>

              {/* Account Type */}
              <Text style={styles.heading}>Select Account Type</Text>
              <View style={styles.typeRow}>
                {ACCOUNT_TYPES.map(({ id, label, Icon }) => {
                  const disabled = disabledTypes.includes(id);
                  const selected = !disabled && selectedType === id;
                  return (
                    <Pressable
                      key={id}
                      onPress={() => !disabled && setSelectedType(id)}
                      disabled={disabled}
                      style={[
                        styles.typeCard,
                        selected && styles.typeCardSelected,
                        disabled && styles.typeCardDisabled,
                      ]}
                    >
                      <Icon size={34} />
                      <Text
                        style={[
                          styles.typeLabel,
                          (selected || disabled) && { color: colors.forest },
                        ]}
                      >
                        {label}
                      </Text>
                      <Text style={styles.typeSubLabel}>
                        {disabled ? 'Already Added' : 'Add from list'}
                      </Text>
                      <View style={styles.indicatorWrap}>
                        {disabled ? (
                          <View style={styles.checkBadge}>
                            <CheckMark size={8} color={colors.surface} />
                          </View>
                        ) : (
                          <RadioDot selected={selected} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Provider section (only for bank/wallet) */}
              {isProviderType && (
                <>
                  <Text style={[t.section, { marginTop: spacing.lg, fontSize: 16, color: colors.textPrimary, fontWeight: '700' }]}>
                    Select {selectedType === 'bank' ? 'Bank' : 'Wallet'}
                  </Text>

                  {/* Search Bar / Dropdown Trigger */}
                  <View style={[styles.searchRow, isBankDropdownOpen && styles.searchRowDropdownOpen]}>
                    <SearchIcon size={16} />
                    <TextInput
                      value={query}
                      onChangeText={(text) => {
                        setQuery(text);
                        setIsBankDropdownOpen(true);
                      }}
                      onFocus={() => setIsBankDropdownOpen(true)}
                      placeholder={`Search ${selectedType === 'bank' ? 'banks' : 'wallets'}`}
                      placeholderTextColor={colors.textSecondary}
                      style={styles.searchInput}
                    />
                    <Pressable onPress={() => setIsBankDropdownOpen(!isBankDropdownOpen)} style={{ padding: 4 }}>
                      <View style={{ transform: [{ rotate: isBankDropdownOpen ? '180deg' : '0deg' }] }}>
                        <ChevronDownIcon size={18} />
                      </View>
                    </Pressable>
                  </View>

                  {/* Dropdown list attached directly below the search bar */}
                  {isBankDropdownOpen && (
                    <View style={styles.bankListDropdown}>
                      <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                        {filteredBanks.map((bank, idx) => {
                          const selected = bank.id === selectedBankId;
                          return (
                            <Pressable
                              key={bank.id}
                              onPress={() => {
                                setSelectedBankId(bank.id);
                                setIsBankDropdownOpen(false);
                              }}
                              style={[
                                styles.bankRow,
                                idx !== filteredBanks.length - 1 && styles.bankRowDivider,
                                selected && styles.bankRowSelected,
                              ]}
                            >
                              <BankLogo bankId={bank.id} size={36} />
                              <Text style={styles.bankName}>{bank.name}</Text>
                              {selected && (
                                <View style={styles.checkBadge}>
                                  <CheckIcon size={12} color={colors.white} />
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                        {filteredBanks.length === 0 && (
                          <Text style={[t.bodyMuted, { padding: spacing.lg, fontSize: 14, color: colors.textSecondary }]}>
                            No {selectedType === 'bank' ? 'banks' : 'wallets'} match "{query}"
                          </Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}

              {/* Starting balance */}
              <Text style={[t.section, { marginTop: spacing.lg, fontSize: 16, color: colors.textPrimary, fontWeight: '700' }]}>
                Starting Balance
              </Text>
              <View style={styles.balanceCard}>
                <View style={styles.rupeeChip}>
                  <Text style={styles.rupeeSymbol}>₹</Text>
                </View>
                <TextInput
                  value={balance}
                  onChangeText={text => setBalance(formatINR(text))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.balanceInput}
                />
              </View>

              {/* Confirmation card */}
              <View style={styles.confirmCard}>
                <ShieldCheckIcon size={24} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.confirmTitle}>Baseline recorded</Text>
                  <Text style={styles.confirmBody}>
                    SpendLens will use this as your financial baseline.
                  </Text>
                </View>
                <View style={styles.cornerPlant} pointerEvents="none">
                  <CornerPlant width={40} height={40} />
                </View>
              </View>
            </ScrollView>

            {/* CTA */}
            <SafeAreaView style={styles.ctaContainer}>
              <Pressable
                onPress={handleCreate}
                disabled={!canCreate}
                style={({ pressed }) => [
                  styles.cta,
                  !canCreate && { opacity: 0.5 },
                  pressed && canCreate && { opacity: 0.9 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add account"
              >
                <Text style={[t.cta, { fontSize: 18, fontWeight: '600', color: colors.white }]}>Add Account</Text>
              </Pressable>
            </SafeAreaView>
          </Animated.View>
    </BaseBottomSheet>
  );
};

const styles = StyleSheet.create({
  // overlay, sheetWrap, sheet, handleContainer, handle, header, closeBtn
  // are now sourced from shellStyles (BaseBottomSheet) for visual consistency.
  mascotWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // closeBtn is now sourced from shellStyles (BaseBottomSheet) for visual consistency.
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginTop: spacing.sm,
  },
  typeCard: {
    width: '48.5%',
    minHeight: 92,
    backgroundColor: colors.cardBg,
    borderWidth: 1.4,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  typeCardSelected: {
    backgroundColor: colors.leafLight,
    borderColor: colors.forest,
    borderWidth: 1.8,
  },
  typeCardDisabled: {
    backgroundColor: colors.leafLight,
    borderColor: '#D7E3C8',
  },
  typeLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  typeSubLabel: {
    marginTop: 1,
    fontSize: 9,
    color: colors.textSecondaryMockup,
  },
  indicatorWrap: {
    marginTop: 6,
  },
  radioOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.2,
    borderColor: '#C9BFAE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
  },
  radioOuterSelected: {
    borderColor: colors.forest,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forest,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search / Dropdown row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderTopLeftRadius: radii.inputSm,
    borderTopRightRadius: radii.inputSm,
    borderBottomLeftRadius: radii.inputSm,
    borderBottomRightRadius: radii.inputSm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  searchRowDropdownOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  bankListDropdown: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
    overflow: 'hidden',
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  bankRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bankRowSelected: {
    backgroundColor: colors.leafLight,
  },
  bankName: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  // Balance
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radii.inputSm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.md,
    height: 48,
  },
  rupeeChip: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  balanceInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  // Confirmation card
  confirmCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.leafLight,
    borderRadius: radii.card - 4,
    padding: spacing.md,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.forest,
  },
  confirmBody: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    paddingRight: 40,
  },
  cornerPlant: {
    position: 'absolute',
    right: 4,
    bottom: -6,
  },
  // CTA
  ctaContainer: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
    backgroundColor: colors.surface,
  },
  cta: {
    height: 50,
    borderRadius: radii.card - 4,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
});

export default AddFinancialSourceSheet;
