import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius, tokens } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { useOnboardingStore } from '@/stores/settings-store';
import { AccountType } from '@/types';
import { PREDEFINED_BANKS, PredefinedBank } from '@/lib/banks';
import { writeLog } from '@/lib/database';
import Svg, { Rect, Path, Line, Circle } from 'react-native-svg';
import {
  AccountIcon,
  BankLogo,
  SearchIcon,
  BankIcon,
  CashIcon,
  CreditCardIcon,
  WalletIcon,
} from '@/components/ui';

const { height } = Dimensions.get('window');

interface AccountSetup {
  name: string;
  type: AccountType;
  balance: string;
  icon: string;
  bankId?: string | null;
  color?: string | null;
}

const ACCOUNT_PRESETS = [
  { label: 'Bank Account', type: 'bank' as AccountType, icon: '🏦' },
  { label: 'Cash', type: 'cash' as AccountType, icon: '💵' },
  { label: 'Credit Card', type: 'credit_card' as AccountType, icon: '💳' },
  { label: 'Digital Wallet', type: 'wallet' as AccountType, icon: '📱' },
];

function formatIndianNumber(valStr: string): string {
  if (!valStr) return '';
  const parts = valStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  let cleanedInteger = integerPart.replace(/,/g, '');
  cleanedInteger = cleanedInteger.replace(/^0+(?=\d)/, '');
  if (!cleanedInteger) return decimalPart;

  let lastThree = cleanedInteger.substring(cleanedInteger.length - 3);
  const otherNumbers = cleanedInteger.substring(0, cleanedInteger.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  
  return formattedOthers + lastThree + decimalPart;
}

const renderPresetIcon = (type: AccountType, color: string) => {
  switch (type) {
    case 'bank': return <BankIcon color={color} size={14} />;
    case 'cash': return <CashIcon color={color} size={14} />;
    case 'credit_card': return <CreditCardIcon color={color} size={14} />;
    case 'wallet': return <WalletIcon color={color} size={14} />;
    default: return null;
  }
};

// ── Financial Foundation SVG Illustration ──────────────────────────────────────
const FinancialFoundationIllustration = React.memo(() => {
  const { theme } = useTheme();
  const obTheme = theme.onboarding;

  return (
    <View style={styles.illustrationContainer}>
      <Svg width={140} height={100} viewBox="0 0 140 100" style={styles.illustrationSvg}>
        {/* Soft background dotted grid */}
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 6 }).map((_, col) => (
            <Circle
              key={`grid-${row}-${col}`}
              cx={col * 24 + 10}
              cy={row * 24 + 10}
              r={1}
              fill={obTheme.brandGreen}
              opacity={0.12}
            />
          ))
        )}

        {/* Protection / Trust Arch (editorial element) */}
        <Path
          d="M 20 85 A 50 50 0 0 1 120 85"
          stroke={obTheme.brandGreen}
          strokeWidth={1.5}
          strokeDasharray="3 5"
          opacity={0.25}
          fill="none"
        />

        {/* Financial Baseline */}
        <Line
          x1={10}
          y1={85}
          x2={130}
          y2={85}
          stroke={obTheme.primary}
          strokeWidth={1.5}
          opacity={0.3}
          strokeLinecap="round"
        />

        {/* Stacked Balance Blocks (isometric/layered editorial feel) */}
        {/* Block 1 (Base Left) */}
        <Rect
          x={32}
          y={60}
          width={36}
          height={24}
          rx={6}
          fill="rgba(255, 255, 255, 0.85)"
          stroke={obTheme.primary}
          strokeWidth={1.5}
        />
        <Line x1={40} y1={72} x2={60} y2={72} stroke={obTheme.primary} strokeWidth={1} opacity={0.3} />

        {/* Block 2 (Base Right) */}
        <Rect
          x={74}
          y={50}
          width={40}
          height={34}
          rx={8}
          fill={obTheme.accentCardBg} // Accent brown
          opacity={0.15}
        />
        <Rect
          x={74}
          y={50}
          width={40}
          height={34}
          rx={8}
          fill="none"
          stroke={obTheme.primary}
          strokeWidth={1.5}
        />
        <Line x1={84} y1={62} x2={104} y2={62} stroke={obTheme.primary} strokeWidth={1} opacity={0.3} />
        <Line x1={84} y1={68} x2={100} y2={68} stroke={obTheme.primary} strokeWidth={1} opacity={0.3} />

        {/* Block 3 (Top Balanced Layer) */}
        <Rect
          x={52}
          y={32}
          width={42}
          height={26}
          rx={6}
          fill={obTheme.brandGreen}
          opacity={0.12}
        />
        <Rect
          x={52}
          y={32}
          width={42}
          height={26}
          rx={6}
          fill="none"
          stroke={obTheme.brandGreen}
          strokeWidth={1.8}
        />
        
        {/* Starting Point Marker / Pin on top of Stack */}
        <Circle cx={73} cy={20} r={4.5} fill={obTheme.brandGreen} stroke={obTheme.primary} strokeWidth={1.2} />
        <Line x1={73} y1={24} x2={73} y2={32} stroke={obTheme.primary} strokeWidth={1.2} strokeLinecap="round" />

        {/* Subtle decorative stars/crosses for starting baseline */}
        <Path d="M 15 50 L 21 50 M 18 47 L 18 53" stroke={obTheme.brandGreen} strokeWidth={1} opacity={0.4} />
        <Circle cx={124} cy={45} r={2.5} fill={obTheme.brandGreen} opacity={0.3} />
      </Svg>
    </View>
  );
});

export default function BalanceSetup() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const obTheme = theme.onboarding;
  const createAccountsBatch = useTransactionStore((s) => s.createAccountsBatch);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  
  const [accounts, setAccounts] = useState<AccountSetup[]>([
    { name: 'Cash', type: 'cash', balance: '', icon: '💵' },
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerType, setPickerType] = useState<'bank' | 'wallet'>('bank');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const addGenericAccount = (type: 'cash' | 'credit_card') => {
    const name = type === 'cash' ? 'Cash' : 'Credit Card';
    const icon = type === 'cash' ? '💵' : '💳';
    
    if (accounts.some((a) => a.type === type && !a.bankId)) {
      return;
    }
    
    setAccounts((prev) => [
      ...prev,
      { name, type, balance: '', icon },
    ]);
  };

  const handleSelectBank = (bank: PredefinedBank) => {
    if (accounts.some((a) => a.bankId === bank.id)) {
      Alert.alert('Duplicate Account', 'This bank has already been added.');
      return;
    }

    setAccounts((prev) => [
      ...prev,
      {
        name: bank.name,
        type: bank.type === 'wallet' ? 'wallet' : 'bank',
        balance: '',
        icon: bank.icon,
        bankId: bank.id,
        color: bank.color,
      },
    ]);
    setModalVisible(false);
  };

  const updateBalance = (index: number, balance: string) => {
    const cleaned = balance.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    const formatted = formatIndianNumber(cleaned);
    setAccounts((prev) =>
      prev.map((acc, i) => (i === index ? { ...acc, balance: formatted } : acc))
    );
  };

  const removeAccount = (index: number) => {
    if (accounts.length <= 1) return;
    setAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const logger = {
    info: (msg: string) => {
      console.log(msg);
      writeLog('ONBOARDING_TRACE', msg).catch((e) =>
        console.warn('[logger] Failed to write trace log:', e)
      );
    },
  };

  const handleFinish = async () => {
    if (accounts.length === 0) {
      Alert.alert('Add Account', 'Please add at least one account.');
      return;
    }
    
    setIsSubmitting(true);
    await writeLog('ONBOARDING_STARTED', `User initiated onboarding complete with ${accounts.length} accounts`);
    try {
      const accountInputs = accounts.map((acc) => {
        const balance = parseFloat(acc.balance.replace(/,/g, '')) || 0;
        return {
          name: acc.name,
          type: acc.type,
          balance,
          currency: 'INR',
          icon: acc.icon,
          color: acc.color || undefined,
          bankId: acc.bankId || null,
        };
      });

      logger.info('[ONBOARDING] createAccountsBatch start');
      await createAccountsBatch(accountInputs);
      logger.info('[ONBOARDING] createAccountsBatch success');

      logger.info('[ONBOARDING] completeOnboarding start');
      await completeOnboarding();
      logger.info('[ONBOARDING] completeOnboarding success');

      await useTransactionStore.getState().loadAccounts();
      await useTransactionStore.getState().loadTransactions();

      logger.info('[ONBOARDING] routing to tabs');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('[Onboarding Account Creation]', error);
      const errorMessage = error.message || 'Failed to save accounts. Please try again.';
      await writeLog('ONBOARDING_FAILED', `Onboarding account creation failed: ${errorMessage}`, { error: error.message });
      Alert.alert('Error', errorMessage);
      setIsSubmitting(false);
    }
  };

  const filteredBanks = PREDEFINED_BANKS.filter(
    (bank) =>
      bank.type === pickerType &&
      !accounts.some((acc) => acc.bankId === bank.id) &&
      bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: obTheme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 20) + 120,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Illustration */}
          <FinancialFoundationIllustration />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: obTheme.primary }]}>
              Let's establish your starting point
            </Text>
            <Text style={[styles.subtitle, { color: obTheme.mutedText }]}>
              Add the accounts you use most often. SpendLens will use this as a baseline to understand your spending and financial health.
            </Text>
          </View>

          {/* Account Cards */}
          {accounts.map((acc, index) => {
            return (
              <Pressable
                key={index}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: '#FFF8EE',
                    borderColor: 'rgba(116, 81, 67, 0.08)',
                    shadowColor: obTheme.primary,
                  },
                  acc.color ? { borderLeftColor: acc.color, borderLeftWidth: 4 } : null
                ]}
                onPress={() => {
                  inputRefs.current[index]?.focus();
                }}
              >
                {/* Header row: Icon, Name (Top Left) & Remove button (Top Right) */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardInfoGroup}>
                    <View style={[styles.iconWrapper, { backgroundColor: acc.color ? `${acc.color}12` : 'rgba(116, 81, 67, 0.05)' }]}>
                      <AccountIcon
                        bankId={acc.bankId || null}
                        accountType={acc.type}
                        icon={acc.icon}
                        color={acc.color || null}
                        size={20}
                      />
                    </View>
                    <Text style={[styles.accountLabel, { color: obTheme.mutedText }]} numberOfLines={1}>
                      {acc.name}
                    </Text>
                  </View>
                  {accounts.length > 1 && (
                    <Pressable
                      onPress={() => removeAccount(index)}
                      style={({ pressed }) => [
                        styles.removeBtn,
                        { opacity: pressed ? 0.6 : 1 }
                      ]}
                    >
                      <Text style={[styles.removeText, { color: obTheme.mutedText }]}>Remove</Text>
                    </Pressable>
                  )}
                </View>

                {/* Large Editable Amount */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.currencySymbol, { color: obTheme.primary }]}>₹</Text>
                  <TextInput
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    style={[styles.balanceInput, { color: obTheme.primary }]}
                    placeholder="0"
                    placeholderTextColor="rgba(116, 81, 67, 0.3)"
                    keyboardType="decimal-pad"
                    value={acc.balance}
                    onChangeText={(text) => updateBalance(index, text)}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </Pressable>
            );
          })}

          {/* Add Account Area */}
          <Text style={[styles.addLabel, { color: obTheme.mutedText }]}>
            Add another account
          </Text>
          <View style={styles.presetRow}>
            {ACCOUNT_PRESETS.map((preset) => {
              const alreadyHasGeneric = accounts.some(
                (a) => a.type === preset.type && !a.bankId
              );
              if ((preset.type === 'cash' || preset.type === 'credit_card') && alreadyHasGeneric) {
                return null;
              }

              return (
                <Pressable
                  key={preset.type}
                  style={({ pressed }) => [
                    styles.presetChip,
                    {
                      backgroundColor: pressed ? 'rgba(116, 81, 67, 0.08)' : '#FAF9F7',
                      borderColor: 'rgba(116, 81, 67, 0.25)',
                    }
                  ]}
                  onPress={() => {
                    if (preset.type === 'bank' || preset.type === 'wallet') {
                      setPickerType(preset.type);
                      setSearchQuery('');
                      setModalVisible(true);
                    } else {
                      addGenericAccount(preset.type as 'cash' | 'credit_card');
                    }
                  }}
                >
                  <View style={styles.presetIconContainer}>
                    {renderPresetIcon(preset.type, obTheme.primary)}
                  </View>
                  <Text style={[styles.presetLabel, { color: obTheme.primary }]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <Pressable
            onPress={handleFinish}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: obTheme.brandGreen,
                opacity: isSubmitting ? 0.6 : (pressed ? 0.9 : 1),
                transform: [{ scale: pressed ? 0.98 : 1 }],
              }
            ]}
          >
            <Text style={[styles.ctaText, { color: '#FFF8EE' }]}>
              {isSubmitting ? 'Setting up...' : 'Start Tracking'}
            </Text>
          </Pressable>
        </View>
      

      {/* Searchable Bank / Wallet Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FAF9F7', borderColor: 'rgba(116, 81, 67, 0.15)' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: obTheme.primary }]}>
                Select {pickerType === 'bank' ? 'Bank Account' : 'Digital Wallet'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                <Text style={[styles.modalCloseText, { color: obTheme.mutedText }]}>✕</Text>
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={[styles.searchContainer, { backgroundColor: 'rgba(116, 81, 67, 0.05)', borderColor: 'rgba(116, 81, 67, 0.15)' }]}>
              <SearchIcon color="rgba(116, 81, 67, 0.4)" size={16} />
              <TextInput
                style={[styles.searchInput, { color: obTheme.primary }]}
                placeholder={`Search ${pickerType === 'bank' ? 'banks' : 'wallets'}...`}
                placeholderTextColor="rgba(116, 81, 67, 0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
            </View>

            {/* Bank/Wallet List */}
            {filteredBanks.length === 0 ? (
              <View style={styles.modalEmptyState}>
                <Text style={[styles.modalEmptyText, { color: obTheme.mutedText }]}>
                  No {pickerType === 'bank' ? 'banks' : 'wallets'} found or all already added.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.bankItem, { borderBottomColor: 'rgba(116, 81, 67, 0.1)' }]}
                    onPress={() => handleSelectBank(item)}
                  >
                    <View style={[styles.bankLogoBg, { backgroundColor: item.color + '15' }]}>
                      <BankLogo bankId={item.id} size={30} />
                    </View>
                    <View style={styles.bankItemInfo}>
                      <Text style={[styles.bankItemName, { color: obTheme.primary }]}>{item.name}</Text>
                      <Text style={[styles.bankItemType, { color: obTheme.mutedText }]}>
                        {item.type === 'bank' ? 'Indian Bank' : 'Digital Wallet'}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing['6xl'] * 2,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  illustrationSvg: {
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  accountCard: {
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xs + 2,
  },
  removeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.1,
  },
  accountLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  currencySymbol: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    marginRight: 2,
  },
  balanceInput: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    padding: 0,
  },
  addLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.xs,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  presetIconContainer: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.caption,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  ctaButton: {
    height: 56,
    borderRadius: tokens.radii.input,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    letterSpacing: 0.1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    height: height * 0.75,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
    height: 50,
    borderWidth: 1,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    padding: 0,
  },
  modalList: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.base,
  },
  bankLogoBg: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankItemInfo: {
    flex: 1,
  },
  bankItemName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.base,
  },
  bankItemType: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  modalEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  modalEmptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
