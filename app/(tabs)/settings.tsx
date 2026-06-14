import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { simulateSMSScan } from '@/features/sms-parser/sms-reader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { TabHeader } from '@/components/ui';
import { typography, spacing, borderRadius } from '@/theme';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { useSettingsStore } from '@/stores/settings-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { formatCurrency } from '@/utils/currency';
import Svg, { Path, Circle } from 'react-native-svg';

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

function renderSettingsIcon(iconName: string, color: string) {
  switch (iconName) {
    case 'profile':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );
    case 'darkMode':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </Svg>
      );
    case 'currency':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M17 1l4 4-4 4" />
          <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <Path d="M7 23l-4-4 4-4" />
          <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </Svg>
      );
    case 'accounts':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 21h18" />
          <Path d="M3 10h18" />
          <Path d="M5 6l7-3 7 3" />
          <Path d="M4 10v11" />
          <Path d="M20 10v11" />
          <Path d="M8 14v3" />
          <Path d="M12 14v3" />
          <Path d="M16 14v3" />
        </Svg>
      );
    case 'categories':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <Path d="M7 7h.01" />
        </Svg>
      );
    case 'sms':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </Svg>
      );
    case 'export':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <Path d="M17 8l-5-5-5 5" />
          <Path d="M12 3v12" />
        </Svg>
      );
    case 'clear':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 6h18" />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </Svg>
      );
    case 'privacy':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </Svg>
      );
    case 'terms':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <Path d="M14 2v6h6" />
          <Path d="M16 13H8" />
          <Path d="M16 17H8" />
          <Path d="M10 9H8" />
        </Svg>
      );
    case 'version':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M12 16v-4" />
          <Path d="M12 8h.01" />
        </Svg>
      );
    default:
      return null;
  }
}

function SettingsRow({ icon, label, value, onPress, isToggle, toggleValue, onToggle }: SettingsRowProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={[styles.settingsRow, { borderBottomColor: theme.borderLight }]}
      onPress={onPress}
      disabled={isToggle}
    >
      <View style={styles.settingsLeft}>
        {renderSettingsIcon(icon, theme.primary)}
        <Text style={[styles.settingsLabel, { color: theme.text, fontFamily: typography.fontFamily.medium }]}>{label}</Text>
      </View>
      {isToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: theme.borderLight, true: theme.primary }}
          thumbColor={toggleValue ? theme.text : theme.textSecondary}
        />
      ) : (
        <View style={styles.settingsRight}>
          {value && (
            <Text style={[styles.settingsValue, { color: theme.textSecondary }]}>{value}</Text>
          )}
          <Text style={[styles.settingsArrow, { color: theme.textSecondary }]}>›</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const transactions = useTransactionStore((s) => s.transactions);
  const getTotalBalance = useTransactionStore((s) => s.getTotalBalance);

  const totalBalance = getTotalBalance();
  const transactionCount = transactions.length;

  const handleSMSParsingPress = () => {
    Alert.alert(
      'SMS Parsing',
      `SpendLens reads financial notifications to automatically track expenses.\n\nPlatform: ${Platform.OS.toUpperCase()}\n\nWould you like to run a demo scan of mock bank SMS messages?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Demo Scan',
          onPress: async () => {
            try {
              const added = await simulateSMSScan();
              // Reload transactions & stats
              await useTransactionStore.getState().loadTransactions();
              await useTransactionStore.getState().loadMonthlyStats();
              Alert.alert('Scan Complete', `Simulated scan found and added ${added} new transactions.`);
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const handleEditProfilePress = () => {
    Alert.alert(
      'Edit Profile',
      'This feature will allow updating your local dashboard name, avatar, and default settings in a future update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TabHeader
          microHeader="USER CONTROL PANEL"
          title="Settings"
          variant="dynamic"
        />

        {/* Profile Card (Tactile Swiss Card) */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '30', borderColor: theme.border }]}>
              <Text style={styles.avatarText}>🧑</Text>
            </View>
            <View style={[styles.profileInfo, { flex: 1 }]}>
              <Text style={[styles.profileName, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
                Local Sandbox Profile
              </Text>
              <Text style={[styles.profileSub, { color: theme.textSecondary }]}>
                {transactionCount} transactions tracked
              </Text>
            </View>
            <Pressable
              onPress={handleEditProfilePress}
              style={({ pressed }) => [
                styles.profileEditBtn,
                { borderColor: theme.border, backgroundColor: pressed ? theme.borderLight : 'transparent' }
              ]}
            >
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 20h9" />
                <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </Svg>
            </Pressable>
          </View>
          <View style={styles.profileBalance}>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>NET WORTH</Text>
            <Text style={[styles.balanceText, { color: theme.text, fontFamily: typography.fontFamily.monoBold }]}>
              {formatCurrency(totalBalance)}
            </Text>
          </View>
        </View>

        {/* General */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: typography.fontFamily.bold }]}>GENERAL</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="darkMode"
            label="Dark Mode"
            isToggle
            toggleValue={isDark}
            onToggle={toggleTheme}
          />
          <SettingsRow icon="accounts" label="Manage Accounts" onPress={() => router.push('/accounts' as any)} />
          <SettingsRow icon="categories" label="Categories" onPress={() => router.push('/categories' as any)} />
          <SettingsRow icon="profile" label="Developer Tools" onPress={() => router.push('/developer-tools' as any)} />
        </View>
 
        {/* Data */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: typography.fontFamily.bold }]}>DATA</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="sms"
            label="SMS Parsing"
            value={Platform.OS === 'android' ? 'Enabled' : 'Simulated'}
            onPress={handleSMSParsingPress}
          />
          <SettingsRow icon="export" label="Export Data" value="JSON/CSV" />
          <SettingsRow icon="clear" label="Clear All Data" onPress={() =>
            Alert.alert('Clear Data', 'This will delete all your transactions and accounts. This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: async () => {
                  // Clean DB
                  const dbModule = require('@/lib/database');
                  try {
                    await dbModule.clearAllData();
                    await useTransactionStore.getState().loadAccounts();
                    await useTransactionStore.getState().loadTransactions();
                    await useTransactionStore.getState().loadMonthlyStats();
                    Alert.alert('Data Cleared', 'All app data has been reset successfully.');
                  } catch (e) {
                    console.error(e);
                  }
                }
              },
            ])
          } />
        </View>
 
        {/* About */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: typography.fontFamily.bold }]}>ABOUT</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow icon="privacy" label="Privacy Policy" />
          <SettingsRow icon="terms" label="Terms of Service" />
          <SettingsRow icon="version" label="Version" value={APP_VERSION} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {APP_NAME} · Tactile Paper Dashboard
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing['6xl'] + spacing.lg },
  header: { marginBottom: spacing.lg },
  microHeader: {
    fontSize: typography.sizes.micro,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: { fontSize: 28, letterSpacing: -0.5 },

  profileCard: {
    padding: spacing.base,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, marginBottom: 2 },
  profileSub: { fontSize: 12 },
  profileBalance: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E3DE',
    paddingTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  balanceText: {
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  settingsGroup: {
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
  },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  settingsIcon: { fontSize: 20 },
  settingsLabel: { fontSize: 15 },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  settingsValue: { fontSize: 13 },
  settingsArrow: { fontSize: 16 },

  footer: { alignItems: 'center', paddingVertical: spacing.xl },
  footerText: { fontSize: typography.sizes.micro },
  profileEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
