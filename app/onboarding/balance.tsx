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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { useTransactionStore } from '@/stores/transaction-store';
import { useOnboardingStore } from '@/stores/settings-store';
import { AccountType } from '@/types';

interface AccountSetup {
  name: string;
  type: AccountType;
  balance: string;
  icon: string;
}

const ACCOUNT_PRESETS: { label: string; type: AccountType; icon: string }[] = [
  { label: 'Bank Account', type: 'bank', icon: '🏦' },
  { label: 'Cash', type: 'cash', icon: '💵' },
  { label: 'Credit Card', type: 'credit_card', icon: '💳' },
  { label: 'Digital Wallet', type: 'wallet', icon: '📱' },
];

export default function BalanceSetup() {
  const { theme } = useTheme();
  const createAccount = useTransactionStore((s) => s.createAccount);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const [accounts, setAccounts] = useState<AccountSetup[]>([
    { name: 'Bank Account', type: 'bank', balance: '', icon: '🏦' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAccount = (preset: typeof ACCOUNT_PRESETS[number]) => {
    setAccounts((prev) => [
      ...prev,
      { name: preset.label, type: preset.type, balance: '', icon: preset.icon },
    ]);
  };

  const updateBalance = (index: number, balance: string) => {
    // Only allow numbers and decimal point
    const cleaned = balance.replace(/[^0-9.]/g, '');
    setAccounts((prev) =>
      prev.map((acc, i) => (i === index ? { ...acc, balance: cleaned } : acc))
    );
  };

  const removeAccount = (index: number) => {
    if (accounts.length <= 1) return;
    setAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      for (const acc of accounts) {
        const balance = parseFloat(acc.balance) || 0;
        await createAccount({
          name: acc.name,
          type: acc.type,
          balance,
          currency: 'INR',
          icon: acc.icon,
        });
      }
      await completeOnboarding();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to create accounts:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            style={[styles.accountCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.accountHeader}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountIcon}>{acc.icon}</Text>
                <Text style={[styles.accountName, { color: theme.text }]}>
                  {acc.name}
                </Text>
              </View>
              {accounts.length > 1 && (
                <Pressable onPress={() => removeAccount(index)}>
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
          {ACCOUNT_PRESETS.filter(
            (preset) => !accounts.some((a) => a.type === preset.type)
          ).map((preset) => (
            <Pressable
              key={preset.type}
              style={[styles.presetChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => addAccount(preset)}
            >
              <Text style={styles.presetIcon}>{preset.icon}</Text>
              <Text style={[styles.presetLabel, { color: theme.textSecondary }]}>
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomSection}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 20,
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
  },
  accountIcon: {
    fontSize: 24,
  },
  accountName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.base,
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
});
