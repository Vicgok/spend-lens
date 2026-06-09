import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { useOnboardingStore } from '@/stores/settings-store';
import { AccountType } from '@/types';
import { PREDEFINED_BANKS, PredefinedBank } from '@/lib/banks';
import { AccountIcon, BankLogo } from '@/components/ui/BankLogo';
import { writeLog } from '@/lib/database';

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
  // Strip leading zeros unless it's just '0'
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

export default function BalanceSetup() {
  const { theme } = useTheme();
  const createAccountsBatch = useTransactionStore((s) => s.createAccountsBatch);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  
  // Start with Cash as a sensible default
  const [accounts, setAccounts] = useState<AccountSetup[]>([
    { name: 'Cash', type: 'cash', balance: '', icon: '💵' },
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerType, setPickerType] = useState<'bank' | 'wallet'>('bank');

  const addGenericAccount = (type: 'cash' | 'credit_card') => {
    const name = type === 'cash' ? 'Cash' : 'Credit Card';
    const icon = type === 'cash' ? '💵' : '💳';
    
    // Check duplicate generic types
    if (accounts.some((a) => a.type === type && !a.bankId)) {
      return;
    }
    
    setAccounts((prev) => [
      ...prev,
      { name, type, balance: '', icon },
    ]);
  };

  const handleSelectBank = (bank: PredefinedBank) => {
    // Double check uniqueness (no duplicate banks)
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
    // Only allow numbers and decimal point
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

      // Hydrate state before navigation
      await useTransactionStore.getState().loadAccounts();
      await useTransactionStore.getState().loadTransactions();

      logger.info('[ONBOARDING] router.replace start');
      router.replace('/(tabs)');
      logger.info('[ONBOARDING] router.replace executed');
    } catch (error: any) {
      console.error('[Onboarding Account Creation]', error);
      const errorMessage = error.message || 'Failed to save accounts. Please try again.';
      await writeLog('ONBOARDING_FAILED', `Onboarding account creation failed: ${errorMessage}`, { error: error.message });
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter predefined list based on search and exclusions (no same bank twice)
  const filteredBanks = PREDEFINED_BANKS.filter(
    (bank) =>
      bank.type === pickerType &&
      !accounts.some((acc) => acc.bankId === bank.id) &&
      bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>💰</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            What's your current balance?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter your current balance for each account. This helps us track your
            finances accurately.
          </Text>
        </View>

        {/* Account Cards */}
        {accounts.map((acc, index) => (
          <View
            key={index}
            style={[
              styles.accountCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              acc.color ? { borderLeftColor: acc.color, borderLeftWidth: 4 } : null
            ]}
          >
            <View style={styles.accountHeader}>
              <View style={styles.accountInfo}>
                <AccountIcon bankId={acc.bankId || null} accountType={acc.type} icon={acc.icon} color={acc.color || null} size={28} />
                <Text style={[styles.accountName, { color: theme.text }]} numberOfLines={1}>
                  {acc.name}
                </Text>
              </View>
              {accounts.length > 1 && (
                <Pressable onPress={() => removeAccount(index)} style={styles.removeBtn}>
                  <Text style={[styles.removeText, { color: theme.expense }]}>Remove</Text>
                </Pressable>
              )}
            </View>
            <View style={[styles.inputContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.primary }]}>₹</Text>
              <TextInput
                style={[styles.balanceInput, { color: theme.text }]}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                value={acc.balance}
                onChangeText={(text) => updateBalance(index, text)}
              />
            </View>
          </View>
        ))}

        {/* Add Account Buttons */}
        <Text style={[styles.addLabel, { color: theme.textSecondary }]}>
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
                style={[styles.presetChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
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
                <Text style={styles.presetIcon}>{preset.icon}</Text>
                <Text style={[styles.presetLabel, { color: theme.textSecondary }]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomSection, { backgroundColor: theme.background }]}>
        <Pressable onPress={handleFinish} disabled={isSubmitting} style={styles.ctaWrapper}>
          <LinearGradient
            colors={theme.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, isSubmitting && styles.ctaDisabled]}
          >
            <Text style={styles.ctaText}>
              {isSubmitting ? 'Setting up...' : 'Start Tracking'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Searchable Bank / Wallet Picker Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select {pickerType === 'bank' ? 'Bank Account' : 'Digital Wallet'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                <Text style={[styles.modalCloseText, { color: theme.textSecondary }]}>✕</Text>
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={[styles.searchContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={styles.searchEmoji}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder={`Search ${pickerType === 'bank' ? 'banks' : 'wallets'}...`}
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
            </View>

            {/* Bank/Wallet List */}
            {filteredBanks.length === 0 ? (
              <View style={styles.modalEmptyState}>
                <Text style={[styles.modalEmptyText, { color: theme.textSecondary }]}>
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
                    style={[styles.bankItem, { borderBottomColor: theme.border }]}
                    onPress={() => handleSelectBank(item)}
                  >
                    <View style={[styles.bankLogoBg, { backgroundColor: item.color + '15' }]}>
                      <BankLogo bankId={item.id} size={30} />
                    </View>
                    <View style={styles.bankItemInfo}>
                      <Text style={[styles.bankItemName, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[styles.bankItemType, { color: theme.textMuted }]}>
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
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 160,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  accountCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: 8,
  },
  accountIcon: {
    fontSize: 24,
  },
  accountName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.base,
    flexShrink: 1,
  },
  removeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    height: 56,
    borderWidth: 1,
  },
  currencySymbol: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 22,
    marginRight: spacing.sm,
  },
  balanceInput: {
    flex: 1,
    fontFamily: typography.fontFamily.mono,
    fontSize: 22,
    padding: 0,
  },
  addLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  presetIcon: {
    fontSize: 16,
  },
  presetLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },
  ctaWrapper: {
    width: '100%',
  },
  ctaButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
    color: '#FFFFFF',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    paddingHorizontal: 24,
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
    marginHorizontal: 24,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
    height: 50,
    borderWidth: 1,
    gap: 8,
  },
  searchEmoji: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    padding: 0,
  },
  modalList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  bankLogoBg: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankLogoEmoji: {
    fontSize: 22,
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
    paddingHorizontal: 32,
  },
  modalEmptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
