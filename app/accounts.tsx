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
  InteractionManager,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { PREDEFINED_BANKS, PredefinedBank } from '@/lib/banks';
import { Account } from '@/types';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { BankLogo, ReadingNotebookMascot, LeafCluster, CurrentAccountsList, TabHeader } from '@/components/ui';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { height } = Dimensions.get('window');

const SETTINGS_COLORS = {
  background: '#E1D7C2',
  surface: '#FFF8EE',
  primary: '#745143',
  secondary: '#54554B',
  green: '#3E5A2A',
  lightGreen: '#EEF4E6',
  border: '#E8DDD0',
};

const ChevronRightIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
));

const BankPresetIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 21h18" />
    <Path d="M3 10h18" />
    <Path d="M5 6l7-3 7 3" />
    <Path d="M4 10v11" />
    <Path d="M20 10v11" />
  </Svg>
));

const CreditCardPresetIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
    <Path d="M2 10h20" />
  </Svg>
));

const WalletPresetIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <Path d="M12 18h.01" />
  </Svg>
));

const ShieldIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
));

const InfoIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 16v-4" />
    <Path d="M12 8h.01" />
  </Svg>
));

const SearchIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="M21 21l-4.3-4.3" />
  </Svg>
));

const CloseIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
));

const BackArrowIcon = React.memo(({ color }: { color: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5" />
    <Path d="M12 19l-7-7 7-7" />
  </Svg>
));

const SingleLeaf = React.memo(({ width = 16, height = 16, strokeColor, fillBg }: { width?: number; height?: number; strokeColor: string; fillBg: string }) => (
  <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
    <Path d="M10 18c-3 0-5-2-5-5 3 0 5 2 5 5z" fill={fillBg} stroke={strokeColor} strokeWidth={1} strokeLinejoin="round" />
    <Path d="M10 18c0-3 2-5 5-5 0 3-2 5-5 5z" fill={fillBg} stroke={strokeColor} strokeWidth={1} strokeLinejoin="round" />
    <Path d="M10 18V10" stroke={strokeColor} strokeWidth={1} strokeLinecap="round" />
  </Svg>
));

export default function ManageAccountsScreen() {
  const insets = useSafeAreaInsets();

  const { accounts, loadAccounts, createAccount, deleteAccount } = useTransactionStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'bank' | 'wallet'>('bank');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected account in the visual stack
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Balance input modal state
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [selectedBank, setSelectedBank] = useState<PredefinedBank | null>(null);
  const [genericType, setGenericType] = useState<'cash' | 'credit_card' | null>(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeferredContent, setShowDeferredContent] = useState(false);
  const [showDeferredModals, setShowDeferredModals] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const contentHandle = InteractionManager.runAfterInteractions(() => {
      setShowDeferredContent(true);
    });
    const modalHandle = InteractionManager.runAfterInteractions(() => {
      setShowDeferredModals(true);
    });

    return () => {
      contentHandle.cancel();
      modalHandle.cancel();
    };
  }, []);

  // Synchronize stack selection
  useEffect(() => {
    if (accounts.length > 0) {
      if (!selectedAccountId || !accounts.some((a) => a.id === selectedAccountId)) {
        setSelectedAccountId(accounts[0].id);
      }
    } else {
      setSelectedAccountId(null);
    }
  }, [accounts, selectedAccountId]);

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
      let createdAcc: Account | undefined;
      if (selectedBank) {
        createdAcc = await createAccount({
          name: selectedBank.name,
          type: selectedBank.type === 'wallet' ? 'wallet' : 'bank',
          balance,
          currency: 'INR',
          icon: selectedBank.icon,
          color: selectedBank.color,
          bankId: selectedBank.id,
        });
      } else if (genericType) {
        createdAcc = await createAccount({
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

      // Auto-focus the new account immediately
      if (createdAcc?.id) {
        setSelectedAccountId(createdAcc.id);
      }

      await loadAccounts();
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
              // Update selected index before deletion if it is currently selected
              if (selectedAccountId === acc.id) {
                const remaining = accounts.filter((a) => a.id !== acc.id);
                setSelectedAccountId(remaining[0]?.id || null);
              }
              await deleteAccount(acc.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await loadAccounts();
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

  // Cyclic stack rotation sorting logic
  const activeSelectedId = selectedAccountId || (accounts[0] ? accounts[0].id : null);
  let orderedAccounts = [...accounts];
  if (activeSelectedId) {
    const selectedIdx = orderedAccounts.findIndex((a) => a.id === activeSelectedId);
    if (selectedIdx > -1) {
      const before = orderedAccounts.slice(0, selectedIdx);
      const after = orderedAccounts.slice(selectedIdx);
      orderedAccounts = [...after, ...before];
    }
  }
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 12 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <View style={styles.headerTop}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace('/(tabs)/settings' as any);
          }}
          style={styles.backButton}
        >
          <BackArrowIcon color={SETTINGS_COLORS.green} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Block */}
        <TabHeader
          microHeader="USER CONTROL PANEL"
          title="Manage Accounts"
          variant="tactile"
          subtitle="Add and manage your accounts to track your net worth better."
          renderRight={() => (
            <View style={styles.headerRight}>
              <View style={styles.mascotLeafDecor}>
                <LeafCluster />
              </View>
              <ReadingNotebookMascot width={90} height={72} />
            </View>
          )}
        />

        {/* Current Accounts */}
        <Text style={styles.sectionTitle}>CURRENT ACCOUNTS</Text>
        <View style={{ marginBottom: 28 }}>
          {showDeferredContent ? (
            <CurrentAccountsList
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelectAccountId={setSelectedAccountId}
              onDeleteAccount={handleDeleteAccount}
              onPressActive={(account) => {
                router.push(`/accounts/${account.id}` as any);
              }}
            />
          ) : (
            <View style={styles.deferredAccountsPlaceholder} />
          )}
        </View>

        {/* Add Account Presets */}
        <Text style={styles.sectionTitle}>ADD NEW ACCOUNT</Text>
        <View style={styles.presetsGrid}>
          {/* Row 1: 2-column grid */}
          <View style={styles.presetsRow}>
            {/* Bank Account Preset Card */}
            <Pressable
              onPress={() => handleOpenBankPicker('bank')}
              style={({ pressed }) => [styles.presetCard, pressed && { opacity: 0.95 }]}
            >
              <View style={styles.presetTop}>
                <View style={styles.presetIconOuter}>
                  <BankPresetIcon color={SETTINGS_COLORS.primary} />
                </View>
                <View style={styles.chevronCircle}>
                  <ChevronRightIcon color={SETTINGS_COLORS.primary} />
                </View>
              </View>
              <View style={styles.presetTextContainer}>
                <Text style={styles.presetTitle}>Bank Account</Text>
                <Text style={styles.presetDesc}>Add savings or current accounts.</Text>
              </View>
            </Pressable>

            {/* Credit Card Preset Card */}
            <Pressable
              onPress={() => handleAddGeneric('credit_card')}
              disabled={accounts.some((a) => a.type === 'credit_card' && !a.bankId)}
              style={({ pressed }) => [
                styles.presetCard,
                accounts.some((a) => a.type === 'credit_card' && !a.bankId) && { opacity: 0.5 },
                pressed && { opacity: 0.95 }
              ]}
            >
              <View style={styles.presetTop}>
                <View style={styles.presetIconOuter}>
                  <CreditCardPresetIcon color={SETTINGS_COLORS.primary} />
                </View>
                <View style={styles.chevronCircle}>
                  <ChevronRightIcon color={SETTINGS_COLORS.primary} />
                </View>
              </View>
              <View style={styles.presetTextContainer}>
                <Text style={styles.presetTitle}>Credit Card</Text>
                <Text style={styles.presetDesc}>Track card spending and repayments.</Text>
              </View>
            </Pressable>
          </View>

          {/* Row 2: Full-width Digital Wallet Card */}
          <Pressable
            onPress={() => handleOpenBankPicker('wallet')}
            style={({ pressed }) => [styles.presetCardFull, pressed && { opacity: 0.95 }]}
          >
            <View style={styles.presetFullLeft}>
              <View style={styles.presetIconOuter}>
                <WalletPresetIcon color={SETTINGS_COLORS.primary} />
              </View>
              <View style={styles.presetFullText}>
                <Text style={styles.presetTitle}>Digital Wallet</Text>
                <Text style={styles.presetDesc}>Track UPI and wallet balances.</Text>
              </View>
            </View>
            <View style={styles.chevronCircle}>
              <ChevronRightIcon color={SETTINGS_COLORS.primary} />
            </View>
          </Pressable>
        </View>

        {/* Privacy Card */}
        {showDeferredContent ? (
          <View style={styles.privacyCard}>
            <View style={styles.privacyIconOuter}>
              <ShieldIcon color={SETTINGS_COLORS.green} />
            </View>
            <View style={{ flex: 1, zIndex: 1 }}>
              <Text style={styles.privacyTitle}>Your Data Stays With You</Text>
              <View style={styles.privacyList}>
                <View style={styles.privacyItem}>
                  <Text style={styles.privacyCheck}>✓</Text>
                  <Text style={styles.privacyText}>Data stored locally</Text>
                </View>
                <View style={styles.privacyItem}>
                  <Text style={styles.privacyCheck}>✓</Text>
                  <Text style={styles.privacyText}>No cloud sync</Text>
                </View>
                <View style={styles.privacyItem}>
                  <Text style={styles.privacyCheck}>✓</Text>
                  <Text style={styles.privacyText}>No bank login required</Text>
                </View>
                <View style={styles.privacyItem}>
                  <Text style={styles.privacyCheck}>✓</Text>
                  <Text style={styles.privacyText}>Full user control</Text>
                </View>
              </View>
            </View>
            <View style={styles.leafDecor}>
              <LeafCluster />
            </View>
          </View>
        ) : (
          <View style={styles.deferredCardPlaceholder} />
        )}

        {/* Bottom Note Card */}
        {showDeferredContent ? (
          <View style={styles.noteCard}>
            <View style={styles.noteIconOuter}>
              <InfoIcon color={SETTINGS_COLORS.primary} />
            </View>
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>Account Updates</Text>
              <Text style={styles.noteText}>
                Balances and transactions update automatically through SMS parsing.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.deferredCardPlaceholder} />
        )}

        {/* Scattered background leaf illustrations */}
        <View style={styles.bgLeaf1} pointerEvents="none">
          <SingleLeaf strokeColor={SETTINGS_COLORS.green} fillBg={SETTINGS_COLORS.lightGreen} />
        </View>
        <View style={styles.bgLeaf2} pointerEvents="none">
          <SingleLeaf strokeColor={SETTINGS_COLORS.green} fillBg={SETTINGS_COLORS.lightGreen} />
        </View>

        {/* Decorative padding to clear bottom corner leaves */}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Bottom leaf cluster background decor */}
      <View style={styles.bottomDecorLeft} pointerEvents="none">
        <LeafCluster />
      </View>
      <View style={styles.bottomDecorRight} pointerEvents="none">
        <LeafCluster />
      </View>

      {/* Searchable Bank Picker Modal */}
      {showDeferredModals ? (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
          statusBarTranslucent={true}
          navigationBarTranslucent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {pickerType === 'bank' ? 'Bank Account' : 'Digital Wallet'}
                </Text>
                <Pressable onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                  <CloseIcon color={SETTINGS_COLORS.secondary} />
                </Pressable>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <SearchIcon color={SETTINGS_COLORS.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${pickerType === 'bank' ? 'banks' : 'wallets'}...`}
                  placeholderTextColor="rgba(116, 81, 67, 0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
              </View>

              {/* Bank List */}
              {filteredBanks.length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Text style={styles.modalEmptyText}>
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
                      style={styles.bankItem}
                      onPress={() => handleSelectBank(item)}
                    >
                      <View style={[styles.bankLogoBg, { backgroundColor: item.color + '15' }]}>
                        <BankLogo bankId={item.id} size={30} />
                      </View>
                      <View style={styles.bankItemInfo}>
                        <Text style={styles.bankItemName}>{item.name}</Text>
                        <Text style={styles.bankItemType}>
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
      ) : null}

      {/* Balance Input Dialog Modal */}
      {showDeferredModals ? (
        <Modal
          visible={balanceModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setBalanceModalVisible(false)}
          statusBarTranslucent={true}
          navigationBarTranslucent={true}
        >
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogCard}>
              <Text style={styles.dialogTitle}>
                Enter Starting Balance
              </Text>
              <Text style={styles.dialogSub}>
                {selectedBank ? `for ${selectedBank.name}` : `for ${genericType === 'cash' ? 'Cash' : 'Credit Card'}`}
              </Text>

              <View style={styles.dialogInputContainer}>
                <Text style={styles.dialogCurrencySymbol}>₹</Text>
                <TextInput
                  style={styles.dialogInput}
                  placeholder="0"
                  placeholderTextColor="rgba(116, 81, 67, 0.4)"
                  keyboardType="decimal-pad"
                  value={balanceInput}
                  onChangeText={(text) => setBalanceInput(text.replace(/[^0-9.]/g, ''))}
                  autoFocus={true}
                />
              </View>

              <View style={styles.dialogActions}>
                <Pressable
                  onPress={() => setBalanceModalVisible(false)}
                  style={styles.dialogBtnCancel}
                >
                  <Text style={styles.dialogBtnCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveAccount}
                  disabled={isSubmitting}
                  style={styles.dialogBtnSave}
                >
                  <Text style={styles.dialogBtnSaveText}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SETTINGS_COLORS.background,
  },
  headerTop: {
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.green,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 60,
  },
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  headerRight: {
    position: 'relative',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  mascotLeafDecor: {
    position: 'absolute',
    left: -18,
    top: -12,
    opacity: 0.35,
    transform: [{ rotate: '-12deg' }],
  },
  microHeader: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: SETTINGS_COLORS.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    color: SETTINGS_COLORS.primary,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: SETTINGS_COLORS.secondary,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    letterSpacing: 1,
    color: SETTINGS_COLORS.secondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  deferredAccountsPlaceholder: {
    height: 212,
  },
  deferredCardPlaceholder: {
    height: 140,
    marginBottom: 20,
  },

  presetsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  presetCard: {
    flex: 1,
    backgroundColor: SETTINGS_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: SETTINGS_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  presetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetIconOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SETTINGS_COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SETTINGS_COLORS.surface,
  },
  presetTextContainer: {
    gap: 2,
  },
  presetTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.primary,
  },
  presetDesc: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: SETTINGS_COLORS.secondary,
    lineHeight: 16,
  },
  presetCardFull: {
    backgroundColor: SETTINGS_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: SETTINGS_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  presetFullLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  presetFullText: {
    flex: 1,
    gap: 2,
  },
  privacyCard: {
    backgroundColor: SETTINGS_COLORS.lightGreen,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: SETTINGS_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  privacyIconOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SETTINGS_COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
  },
  privacyTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.green,
    marginBottom: 12,
  },
  privacyList: {
    gap: 8,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyCheck: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.green,
  },
  privacyText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: SETTINGS_COLORS.secondary,
  },
  leafDecor: {
    position: 'absolute',
    right: 0,
    bottom: -10,
  },
  noteCard: {
    backgroundColor: SETTINGS_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 16,
    shadowColor: SETTINGS_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noteIconOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SETTINGS_COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
  },
  noteContent: {
    flex: 1,
    gap: 4,
  },
  noteTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.primary,
  },
  noteText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: SETTINGS_COLORS.secondary,
    lineHeight: 18,
  },
  bottomDecorLeft: {
    position: 'absolute',
    left: -10,
    bottom: -10,
    opacity: 0.15,
  },
  bottomDecorRight: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.15,
    transform: [{ scaleX: -1 }],
  },
  bgLeaf1: {
    position: 'absolute',
    right: 32,
    top: 240,
    opacity: 0.08,
  },
  bgLeaf2: {
    position: 'absolute',
    left: 16,
    top: 480,
    opacity: 0.08,
    transform: [{ rotate: '45deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: SETTINGS_COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    borderBottomWidth: 0,
    height: height * 0.75,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    color: SETTINGS_COLORS.primary,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SETTINGS_COLORS.lightGreen,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    gap: 8,
    backgroundColor: SETTINGS_COLORS.surface,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    padding: 0,
    color: SETTINGS_COLORS.primary,
  },
  modalList: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: SETTINGS_COLORS.border,
    gap: 16,
  },
  bankLogoBg: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankItemInfo: {
    flex: 1,
  },
  bankItemName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: SETTINGS_COLORS.primary,
  },
  bankItemType: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: SETTINGS_COLORS.secondary,
    marginTop: 2,
  },
  modalEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalEmptyText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: SETTINGS_COLORS.secondary,
    textAlign: 'center',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: SETTINGS_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    padding: 24,
    alignItems: 'center',
    shadowColor: SETTINGS_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dialogTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    color: SETTINGS_COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  dialogSub: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: SETTINGS_COLORS.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    marginBottom: 24,
    width: '100%',
    backgroundColor: SETTINGS_COLORS.surface,
  },
  dialogCurrencySymbol: {
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 22,
    marginRight: 8,
    color: SETTINGS_COLORS.primary,
  },
  dialogInput: {
    flex: 1,
    fontFamily: typography.fontFamily.monoBold,
    fontSize: 22,
    padding: 0,
    color: SETTINGS_COLORS.primary,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  dialogBtnCancel: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBtnCancelText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: SETTINGS_COLORS.primary,
  },
  dialogBtnSave: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: SETTINGS_COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogBtnSaveText: {
    color: SETTINGS_COLORS.surface,
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
});
