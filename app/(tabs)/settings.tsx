import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { simulateSMSScan } from '@/features/sms-parser/sms-reader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { useSettingsStore } from '@/stores/settings-store';

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

function SettingsRow({ icon, label, value, onPress, isToggle, toggleValue, onToggle }: SettingsRowProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={[styles.settingsRow, { borderBottomColor: theme.border }]}
      onPress={onPress}
      disabled={isToggle}
    >
      <View style={styles.settingsLeft}>
        <Text style={styles.settingsIcon}>{icon}</Text>
        <Text style={[styles.settingsLabel, { color: theme.text }]}>{label}</Text>
      </View>
      {isToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: theme.primary + '80' }}
          thumbColor={toggleValue ? theme.primary : theme.textMuted}
        />
      ) : (
        <View style={styles.settingsRight}>
          {value && (
            <Text style={[styles.settingsValue, { color: theme.textSecondary }]}>{value}</Text>
          )}
          <Text style={[styles.settingsArrow, { color: theme.textMuted }]}>›</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { currency } = useSettingsStore();

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
              Alert.alert('Scan Complete', `Simulated scan found and added ${added} new transactions.`);
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        {/* Profile Section */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🧑</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>Free Account</Text>
            <Text style={[styles.profileSub, { color: theme.textSecondary }]}>
              Sign in to sync & backup
            </Text>
          </View>
          <Pressable
            style={[styles.upgradeBtn, { borderColor: theme.primary }]}
            onPress={() => Alert.alert('Coming Soon', 'Premium features will be available in the next update!')}
          >
            <Text style={[styles.upgradeBtnText, { color: theme.primary }]}>Upgrade</Text>
          </Pressable>
        </View>

        {/* General */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>GENERAL</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="🌙"
            label="Dark Mode"
            isToggle
            toggleValue={isDark}
            onToggle={toggleTheme}
          />
          <SettingsRow icon="💱" label="Currency" value={currency} />
          <SettingsRow icon="🏦" label="Manage Accounts" onPress={() => router.push('/accounts' as any)} />
          <SettingsRow icon="🏷️" label="Categories" onPress={() => router.push('/categories' as any)} />
        </View>

        {/* Data */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>DATA</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="📱"
            label="SMS Parsing"
            value={Platform.OS === 'android' ? 'Enabled' : 'Simulated'}
            onPress={handleSMSParsingPress}
          />
          <SettingsRow icon="📤" label="Export Data" value="CSV" />
          <SettingsRow icon="🗑️" label="Clear All Data" onPress={() =>
            Alert.alert('Clear Data', 'This will delete all your transactions and accounts. This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive' },
            ])
          } />
        </View>

        {/* Premium */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PREMIUM</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow icon="⭐" label="Upgrade to Premium" />
          <SettingsRow icon="🔄" label="Restore Purchases" />
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ABOUT</Text>
        <View style={[styles.settingsGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow icon="📋" label="Privacy Policy" />
          <SettingsRow icon="📜" label="Terms of Service" />
          <SettingsRow icon="ℹ️" label="Version" value={APP_VERSION} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            {APP_NAME} · Made with ❤️
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.sizes.xl, marginBottom: 20 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: 28,
    gap: 14,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 24 },
  profileInfo: { flex: 1 },
  profileName: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.base, marginBottom: 2 },
  profileSub: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.xs },
  upgradeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.full, borderWidth: 1.5 },
  upgradeBtnText: { fontFamily: typography.fontFamily.semibold, fontSize: typography.sizes.sm },

  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsGroup: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsIcon: { fontSize: 20 },
  settingsLabel: { fontFamily: typography.fontFamily.medium, fontSize: typography.sizes.base },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsValue: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.sm },
  settingsArrow: { fontSize: 20, fontWeight: '300' },

  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontFamily: typography.fontFamily.regular, fontSize: typography.sizes.xs },
});
