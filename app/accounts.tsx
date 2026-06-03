import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { PREDEFINED_BANKS, PredefinedBank } from '@/lib/banks';
import { AccountType, Account } from '@/types';
import { formatCurrency } from '@/utils/currency';
import * as Haptics from 'expo-haptics';
import { AccountIcon, BankLogo } from '@/components/ui/BankLogo';

const { width, height } = Dimensions.get('window');

const ACCOUNT_PRESETS = [
  { label: 'Bank Account', type: 'bank' as AccountType, icon: '🏦' },
  { label: 'Cash', type: 'cash' as AccountType, icon: '💵' },
  { label: 'Credit Card', type: 'credit_card' as AccountType, icon: '💳' },
  { label: 'Digital Wallet', type: 'wallet' as AccountType, icon: '📱' },
];

export default function ManageAccountsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { accounts, loadAccounts, createAccount, deleteAccount } = useTransactionStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'bank' | 'wallet'>('bank');
  const [searchQuery, setSearchQuery] = useState('');

  // Balance input modal state
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [selectedBank, setSelectedBank] = useState<PredefinedBank | null>(null);
  const [genericType, setGenericType] = useState<'cash' | 'credit_card' | null>(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleOpenBankPicker = (type: 'bank' | 'wallet') => {
    setPickerType(type);
    setSearchQuery('');
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectBank = (bank: PredefinedBank) => {
    setSelectedBank(bank);
    setGenericType(null);
    setBalanceInput('');
    setModalVisible(false);
    setBalanceModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddGeneric = (type: 'cash' | 'credit_card') => {
    // Check if generic type already exists
    if (accounts.some((a) => a.type === type && !a.bankId)) {
      Alert.alert('Duplicate Account', `You have already added a ${type === 'cash' ? 'Cash' : 'Credit Card'} account.`);
      return;
    }
    setGenericType(type);
    setSelectedBank(null);
    setBalanceInput('');
    setBalanceModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveAccount = async () => {
    const balance = parseFloat(balanceInput) || 0;
    setIsSubmitting(true);

    try {
      if (selectedBank) {
        await createAccount({
          name: selectedBank.name,
          type: selectedBank.type === 'wallet' ? 'wallet' : 'bank',
          balance,
          currency: 'INR',
          icon: selectedBank.icon,
          color: selectedBank.color,
          bankId: selectedBank.id,
        });
      } else if (genericType) {
        await createAccount({
          name: genericType === 'cash' ? 'Cash' : 'Credit Card',
          type: genericType,
          balance,
          currency: 'INR',
          icon: genericType === 'cash' ? '💵' : '💳',
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBalanceModalVisible(false);
      setSelectedBank(null);
      setGenericType(null);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = (acc: Account) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${acc.name}"? This will delete all transactions associated with this account. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(acc.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={[styles.headerBtnText, { color: theme.primary }]}>Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Accounts</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Accounts */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>CURRENT ACCOUNTS</Text>
        {accounts.map((acc) => (
          <View
            key={acc.id}
            style={[
              styles.accountCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              acc.color ? { borderLeftColor: acc.color, borderLeftWidth: 4 } : null
            ]}
          >
            <View style={styles.accountHeader}>
              <View style={styles.accountInfo}>
                <AccountIcon bankId={acc.bankId} accountType={acc.type} icon={acc.icon} color={acc.color} size={32} />
                <View>
                  <Text style={[styles.accountNameText, { color: theme.text }]} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Text style={[styles.accountTypeText, { color: theme.textSecondary }]}>
                    {acc.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => handleDeleteAccount(acc)} style={styles.deleteBtn}>
                <Text style={[styles.deleteText, { color: theme.expense }]}>Remove</Text>
              </Pressable>
            </View>
            <Text style={[styles.accountBalance, { color: theme.text }]}>
              {formatCurrency(acc.balance)}
            </Text>
          </View>
        ))}

        {/* Add Account Buttons */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 24 }]}>ADD NEW ACCOUNT</Text>
        <View style={styles.presetsGrid}>
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
                style={[styles.presetCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  if (preset.type === 'bank' || preset.type === 'wallet') {
                    handleOpenBankPicker(preset.type);
                  } else {
                    handleAddGeneric(preset.type as 'cash' | 'credit_card');
                  }
                }}
              >
                <Text style={styles.presetIcon}>{preset.icon}</Text>
                <Text style={[styles.presetLabel, { color: theme.text }]} numberOfLines={1}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Searchable Bank Picker Modal */}
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

            {/* Bank List */}
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

      {/* Balance Input Dialog Modal */}
      <Modal
        visible={balanceModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setBalanceModalVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.dialogTitle, { color: theme.text }]}>
              Enter Starting Balance
            </Text>
            <Text style={[styles.dialogSub, { color: theme.textSecondary }]}>
              {selectedBank ? `for ${selectedBank.name}` : `for ${genericType === 'cash' ? 'Cash' : 'Credit Card'}`}
            </Text>

            <View style={[styles.dialogInputContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <Text style={[styles.currencySymbol, { color: theme.primary }]}>₹</Text>
              <TextInput
                style={[styles.dialogInput, { color: theme.text }]}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                value={balanceInput}
                onChangeText={(text) => setBalanceInput(text.replace(/[^0-9.]/g, ''))}
                autoFocus={true}
              />
            </View>

            <View style={styles.dialogActions}>
              <Pressable
                onPress={() => setBalanceModalVisible(false)}
                style={[styles.dialogBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.dialogBtnText, { color: theme.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveAccount}
                disabled={isSubmitting}
                style={styles.dialogSaveBtnWrapper}
              >
                <LinearGradient
                  colors={theme.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dialogSaveBtn}
                >
                  <Text style={styles.dialogSaveBtnText}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 6, width: 60 },
  headerBtnText: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.sm },
  headerTitle: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.md, flex: 1, textAlign: 'center' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 2,
  },

  accountCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: 8,
  },
  accountIcon: {
    fontSize: 22,
  },
  accountNameText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.sm,
    flexShrink: 1,
  },
  accountTypeText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.bold,
    marginTop: 2,
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.xs,
  },
  accountBalance: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: typography.sizes.md,
    marginTop: 4,
    marginLeft: 32,
  },

  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  presetIcon: {
    fontSize: 24,
  },
  presetLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
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

  // Dialog styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  dialogTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: 4,
  },
  dialogSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    height: 56,
    borderWidth: 1,
    marginBottom: 24,
    width: '100%',
  },
  currencySymbol: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 22,
    marginRight: spacing.sm,
  },
  dialogInput: {
    flex: 1,
    fontFamily: typography.fontFamily.mono,
    fontSize: 22,
    padding: 0,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogBtn: {
    flex: 1,
    height: 50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBtnText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.sm,
  },
  dialogSaveBtnWrapper: {
    flex: 1,
  },
  dialogSaveBtn: {
    height: 50,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogSaveBtnText: {
    color: '#FFF',
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.sm,
  },
});
