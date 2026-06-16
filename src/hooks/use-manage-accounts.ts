import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, InteractionManager } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PREDEFINED_BANKS, PredefinedBank } from '@/lib/banks';
import { useTransactionStore } from '@/stores/transaction-store';
import { Account } from '@/types';

export function useManageAccounts() {
  const { accounts, loadAccounts, createAccount, deleteAccount } = useTransactionStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'bank' | 'wallet'>('bank');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
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

  useEffect(() => {
    if (accounts.length > 0) {
      if (!selectedAccountId || !accounts.some((account) => account.id === selectedAccountId)) {
        setSelectedAccountId(accounts[0].id);
      }
    } else {
      setSelectedAccountId(null);
    }
  }, [accounts, selectedAccountId]);

  const handleOpenBankPicker = useCallback((type: 'bank' | 'wallet') => {
    setPickerType(type);
    setSearchQuery('');
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSelectBank = useCallback((bank: PredefinedBank) => {
    setSelectedBank(bank);
    setGenericType(null);
    setBalanceInput('');
    setModalVisible(false);
    setBalanceModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleAddGeneric = useCallback(
    (type: 'cash' | 'credit_card') => {
      if (accounts.some((account) => account.type === type && !account.bankId)) {
        Alert.alert('Duplicate Account', `You have already added a ${type === 'cash' ? 'Cash' : 'Credit Card'} account.`);
        return;
      }

      setGenericType(type);
      setSelectedBank(null);
      setBalanceInput('');
      setBalanceModalVisible(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [accounts]
  );

  const handleSaveAccount = useCallback(async () => {
    const balance = parseFloat(balanceInput) || 0;
    setIsSubmitting(true);

    try {
      let createdAccount: Account | undefined;

      if (selectedBank) {
        createdAccount = await createAccount({
          name: selectedBank.name,
          type: selectedBank.type === 'wallet' ? 'wallet' : 'bank',
          balance,
          currency: 'INR',
          icon: selectedBank.icon,
          color: selectedBank.color,
          bankId: selectedBank.id,
        });
      } else if (genericType) {
        createdAccount = await createAccount({
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

      if (createdAccount?.id) {
        setSelectedAccountId(createdAccount.id);
      }

      await loadAccounts();
    } catch {
      Alert.alert('Error', 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }, [balanceInput, createAccount, genericType, loadAccounts, selectedBank]);

  const handleDeleteAccount = useCallback(
    (account: Account) => {
      Alert.alert(
        'Delete Account',
        `Are you sure you want to delete "${account.name}"? This will delete all transactions associated with this account. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                if (selectedAccountId === account.id) {
                  const remaining = accounts.filter((currentAccount) => currentAccount.id !== account.id);
                  setSelectedAccountId(remaining[0]?.id || null);
                }
                await deleteAccount(account.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                await loadAccounts();
              } catch {
                Alert.alert('Error', 'Failed to delete account.');
              }
            },
          },
        ]
      );
    },
    [accounts, deleteAccount, loadAccounts, selectedAccountId]
  );

  const filteredBanks = useMemo(
    () =>
      PREDEFINED_BANKS.filter(
        (bank) =>
          bank.type === pickerType &&
          !accounts.some((account) => account.bankId === bank.id) &&
          bank.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [accounts, pickerType, searchQuery]
  );

  return {
    accounts,
    balanceInput,
    balanceModalVisible,
    filteredBanks,
    genericType,
    handleAddGeneric,
    handleDeleteAccount,
    handleOpenBankPicker,
    handleSaveAccount,
    handleSelectBank,
    isSubmitting,
    modalVisible,
    pickerType,
    searchQuery,
    selectedAccountId,
    selectedBank,
    setBalanceInput,
    setBalanceModalVisible,
    setModalVisible,
    setSearchQuery,
    setSelectedAccountId,
    showDeferredContent,
    showDeferredModals,
  };
}
