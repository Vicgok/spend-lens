import { useCallback, useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { writeLog } from '@/lib/database';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/navigation/routes';
import { useOnboardingStore } from '@/stores/settings-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { AccountType } from '@/types';
import { PredefinedBank } from '@/lib/banks';

export interface AccountSetup {
  name: string;
  type: AccountType;
  balance: string;
  icon: string;
  bankId?: string | null;
  color?: string | null;
}

export const ACCOUNT_PRESETS = [
  { label: 'Bank Account', type: 'bank' as AccountType, icon: 'bank' },
  { label: 'Cash', type: 'cash' as AccountType, icon: 'cash' },
  { label: 'Credit Card', type: 'credit_card' as AccountType, icon: 'credit_card' },
  { label: 'Digital Wallet', type: 'wallet' as AccountType, icon: 'wallet' },
] as const;

const DEFAULT_ACCOUNTS: AccountSetup[] = [
  { name: 'Cash', type: 'cash', balance: '', icon: '💵' },
];

export function formatIndianNumber(valStr: string): string {
  if (!valStr) return '';
  const parts = valStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : '';

  let cleanedInteger = integerPart.replace(/,/g, '');
  cleanedInteger = cleanedInteger.replace(/^0+(?=\d)/, '');
  if (!cleanedInteger) return decimalPart;

  let lastThree = cleanedInteger.substring(cleanedInteger.length - 3);
  const otherNumbers = cleanedInteger.substring(0, cleanedInteger.length - 3);
  if (otherNumbers !== '') {
    lastThree = `,${lastThree}`;
  }
  const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return formattedOthers + lastThree + decimalPart;
}

export function useOnboardingBalance() {
  const createAccountsBatch = useTransactionStore((s) => s.createAccountsBatch);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const [accounts, setAccounts] = useState<AccountSetup[]>(DEFAULT_ACCOUNTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickerType, setPickerType] = useState<'bank' | 'wallet'>('bank');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const addGenericAccount = useCallback((type: 'cash' | 'credit_card') => {
    const name = type === 'cash' ? 'Cash' : 'Credit Card';
    const icon = type === 'cash' ? '💵' : '💳';

    setAccounts((prev) => {
      if (prev.some((account) => account.type === type && !account.bankId)) {
        return prev;
      }

      return [...prev, { name, type, balance: '', icon }];
    });
  }, []);

  const handleSelectBank = useCallback((bank: PredefinedBank) => {
    let isDuplicate = false;

    setAccounts((prev) => {
      if (prev.some((account) => account.bankId === bank.id)) {
        isDuplicate = true;
        return prev;
      }

      return [
        ...prev,
        {
          name: bank.name,
          type: bank.type === 'wallet' ? 'wallet' : 'bank',
          balance: '',
          icon: bank.icon,
          bankId: bank.id,
          color: bank.color,
        },
      ];
    });

    if (isDuplicate) {
      Alert.alert('Duplicate Account', 'This bank has already been added.');
      return;
    }

    setModalVisible(false);
  }, []);

  const updateBalance = useCallback((index: number, balance: string) => {
    const cleaned = balance.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    const formatted = formatIndianNumber(cleaned);
    setAccounts((prev) =>
      prev.map((account, accountIndex) =>
        accountIndex === index ? { ...account, balance: formatted } : account
      )
    );
  }, []);

  const removeAccount = useCallback((index: number) => {
    setAccounts((prev) => {
      if (prev.length <= 1) {
        return prev;
      }

      return prev.filter((_, accountIndex) => accountIndex !== index);
    });
  }, []);

  const handleOpenPicker = useCallback((type: 'bank' | 'wallet') => {
    setPickerType(type);
    setSearchQuery('');
    setModalVisible(true);
  }, []);

  const handleFinish = useCallback(async () => {
    if (accounts.length === 0) {
      Alert.alert('Add Account', 'Please add at least one account.');
      return;
    }

    setIsSubmitting(true);
    await writeLog(
      'ONBOARDING_STARTED',
      `User initiated onboarding complete with ${accounts.length} accounts`
    );

    try {
      const accountInputs = accounts.map((account) => ({
        name: account.name,
        type: account.type,
        balance: parseFloat(account.balance.replace(/,/g, '')) || 0,
        currency: 'INR',
        icon: account.icon,
        color: account.color || undefined,
        bankId: account.bankId || null,
      }));

      logger.debug('[ONBOARDING] createAccountsBatch start');
      await createAccountsBatch(accountInputs);
      logger.debug('[ONBOARDING] createAccountsBatch success');

      logger.debug('[ONBOARDING] completeOnboarding start');
      await completeOnboarding();
      logger.debug('[ONBOARDING] completeOnboarding success');

      if (!useOnboardingStore.getState().isComplete) {
        throw new Error('Onboarding completion state was not confirmed.');
      }

      await useTransactionStore.getState().loadAccounts(true);
      await useTransactionStore.getState().loadTransactions();
      router.replace(ROUTES.tabs);
    } catch (error: any) {
      logger.error('[Onboarding Account Creation]', {
        error: error instanceof Error ? error.message : String(error),
      });
      const errorMessage =
        error.message || 'Failed to save accounts. Please try again.';
      await writeLog(
        'ONBOARDING_FAILED',
        `Onboarding account creation failed: ${errorMessage}`,
        { error: error.message }
      );
      Alert.alert('Error', errorMessage);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }, [accounts, completeOnboarding, createAccountsBatch]);

  const hasGenericAccount = useCallback(
    (type: AccountType) => accounts.some((account) => account.type === type && !account.bankId),
    [accounts]
  );

  return {
    accounts,
    accountsCount: accounts.length,
    addGenericAccount,
    handleFinish,
    handleOpenPicker,
    handleSelectBank,
    hasGenericAccount,
    inputRefs,
    isSubmitting,
    modalVisible,
    pickerType,
    removeAccount,
    searchQuery,
    setModalVisible,
    setSearchQuery,
    updateBalance,
  };
}
