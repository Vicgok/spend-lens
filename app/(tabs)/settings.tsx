import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabHeader, ReadingNotebookMascot, LeafCluster, CornerPlant } from '@/components/ui';
import { typography, spacing } from '@/theme';
import { APP_VERSION } from '@/lib/constants';
import { useTransactionStore } from '@/stores/transaction-store';
import { formatCurrency } from '@/utils/currency';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle, Rect, Ellipse } from 'react-native-svg';

const SETTINGS_COLORS = {
  background: '#E1D7C2',
  surface: '#FFF8EE',
  primary: '#745143',
  secondary: '#54554B',
  green: '#3E5A2A',
  lightGreen: '#EEF4E6',
  border: '#E8DDD0',
};

const ChevronRight = React.memo(({ color }: { color: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
));

interface SettingsRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  statusBadge?: React.ReactNode;
  isLast?: boolean;
}

function renderSettingsIcon(iconName: string, color: string) {
  switch (iconName) {
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
    case 'notifications':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
    case 'dataProcessing':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Ellipse cx="12" cy="5" rx="9" ry="3" />
          <Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <Path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </Svg>
      );
    case 'localFirst':
      return (
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </Svg>
      );
    default:
      return null;
  }
}

const SettingsRow = React.memo(({ icon, title, subtitle, value, onPress, showChevron = true, statusBadge, isLast }: SettingsRowProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        isLast && { borderBottomWidth: 0 },
        pressed && onPress ? { backgroundColor: 'rgba(116, 81, 67, 0.04)' } : null
      ]}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconContainer}>
          {renderSettingsIcon(icon, SETTINGS_COLORS.primary)}
        </View>
        <View style={styles.rowTextContainer}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.rowRight}>
        {statusBadge}
        {value && !statusBadge && <Text style={styles.rowValue}>{value}</Text>}
        {showChevron && onPress && <ChevronRight color={SETTINGS_COLORS.primary} />}
      </View>
    </Pressable>
  );
});

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const transactions = useTransactionStore((s) => s.transactions);
  const getTotalBalance = useTransactionStore((s) => s.getTotalBalance);
  const loadAccounts = useTransactionStore((s) => s.loadAccounts);

  const totalBalance = getTotalBalance();
  const transactionCount = transactions.length;

  const handleSMSStatusPress = () => {
    Alert.alert(
      'SMS Tracking',
      `SpendLens reads incoming bank SMS messages to automate expense tracking — all processed locally on your device.\n\nPlatform: ${Platform.OS.toUpperCase()}`,
      [{ text: 'OK' }]
    );
  };

  const handleEditProfilePress = () => {
    Alert.alert(
      'Edit Profile',
      'This feature will allow updating your local dashboard name, avatar, and default settings in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleNotificationsPress = () => {
    Alert.alert(
      'Configure Alerts',
      'This feature will allow customizing SMS transaction alerts and weekly summary notifications in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleExportDataPress = () => {
    Alert.alert(
      'Export Data',
      'This feature will allow exporting your transaction history as JSON or CSV in a future update.',
      [{ text: 'OK' }]
    );
  };

  const handleClearAllDataPress = () => {
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
    ]);
  };

  const handleTermsPress = () => {
    Alert.alert(
      'Terms of Service',
      'SpendLens is a local-first application. All data is stored locally on your device. By using this app, you agree that your financial data is your responsibility.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPress = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is our priority. SpendLens does not collect, transmit, or share your financial or personal information. All SMS processing and transaction tracking happen directly on your device.',
      [{ text: 'OK' }]
    );
  };

  const handleDataProcessingPress = () => {
    Alert.alert(
      'Data Processing',
      'All SMS text parsing is done using local regex patterns. No data is sent to external servers or third-party APIs.',
      [{ text: 'OK' }]
    );
  };

  const handleLocalFirstPress = () => {
    Alert.alert(
      'Local-First Architecture',
      'SpendLens uses SQLite database stored on your device. We do not use database cloud sync, meaning your records are entirely yours.',
      [{ text: 'OK' }]
    );
  };

  // P1-6 FIX: was fire-and-forget with no forceRefresh — accounts screen got stale data.
  // Now awaits a forced SQLite read before navigating.
  const handleManageAccountsPress = async () => {
    await loadAccounts(true);
    router.push('/accounts' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TabHeader
          microHeader="USER CONTROL PANEL"
          title="Settings"
          subtitle="Manage your profile, data and app preferences."
          variant="tactile"
          renderRight={() => (
            <ReadingNotebookMascot width={90} height={72} />
          )}
        />

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            {/* User Avatar Silhouette */}
            <View style={styles.avatar}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={SETTINGS_COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <Circle cx="12" cy="7" r="4" />
              </Svg>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Local Sandbox Profile</Text>
              <Text style={styles.profileSub}>{transactionCount} transactions tracked</Text>
            </View>
          </View>
          
          <View style={styles.profileDivider} />
          
          <View style={styles.profileBottomRow}>
            <View>
              <Text style={styles.balanceLabel}>NET WORTH</Text>
              <Text style={styles.balanceText}>{formatCurrency(totalBalance)}</Text>
            </View>
            <Pressable
              onPress={handleEditProfilePress}
              style={({ pressed }) => [
                styles.profileEditBtn,
                { backgroundColor: pressed ? 'rgba(116, 81, 67, 0.1)' : 'rgba(116, 81, 67, 0.05)' }
              ]}
            >
              <Text style={styles.profileEditBtnText}>Edit</Text>
            </Pressable>
          </View>
        </View>

        {/* General Section */}
        <Text style={styles.sectionTitle}>GENERAL</Text>
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="accounts"
            title="Manage Accounts"
            subtitle="View and manage your linked accounts"
            onPress={handleManageAccountsPress}
          />
          <SettingsRow
            icon="categories"
            title="Categories"
            subtitle="Manage spending categories"
            onPress={() => router.push('/categories' as any)}
          />
          <SettingsRow
            icon="notifications"
            title="Notifications"
            subtitle="Configure alerts and reminders"
            onPress={handleNotificationsPress}
            isLast
          />
        </View>
 
        {/* Data Section */}
        <Text style={styles.sectionTitle}>DATA</Text>
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="sms"
            title="SMS Tracking"
            subtitle="Financial SMS processed locally on-device"
            onPress={handleSMSStatusPress}
            statusBadge={
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {Platform.OS === 'android' ? 'Enabled' : 'Android only'}
                </Text>
              </View>
            }
            showChevron={false}
          />
          <SettingsRow
            icon="export"
            title="Export Data"
            onPress={handleExportDataPress}
            value="JSON / CSV"
            showChevron={false}
          />
          <SettingsRow
            icon="clear"
            title="Clear All Data"
            onPress={handleClearAllDataPress}
            isLast
          />
        </View>
 
        {/* Privacy Card */}
        <View style={styles.privacyCard}>
          <View style={{ flex: 1, zIndex: 1 }}>
            <Text style={styles.privacyTitle}>Your Data Stays With You</Text>
            <View style={styles.privacyList}>
              <View style={styles.privacyItem}>
                <Text style={styles.privacyCheck}>✓</Text>
                <Text style={styles.privacyText}>SMS processed locally</Text>
              </View>
              <View style={styles.privacyItem}>
                <Text style={styles.privacyCheck}>✓</Text>
                <Text style={styles.privacyText}>No bank login required</Text>
              </View>
              <View style={styles.privacyItem}>
                <Text style={styles.privacyCheck}>✓</Text>
                <Text style={styles.privacyText}>No cloud sync</Text>
              </View>
              <View style={styles.privacyItem}>
                <Text style={styles.privacyCheck}>✓</Text>
                <Text style={styles.privacyText}>Financial data never leaves device</Text>
              </View>
            </View>
          </View>
          <View style={styles.leafDecor}>
            <LeafCluster />
          </View>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="terms"
            title="Terms of Service"
            onPress={handleTermsPress}
          />
          <SettingsRow
            icon="privacy"
            title="Privacy Policy"
            onPress={handlePrivacyPress}
          />
          <SettingsRow
            icon="version"
            title="App Version"
            value={APP_VERSION}
            showChevron={false}
          />
          <SettingsRow
            icon="dataProcessing"
            title="Data Processing"
            onPress={handleDataProcessingPress}
          />
          <SettingsRow
            icon="localFirst"
            title="Local-First Architecture"
            onPress={handleLocalFirstPress}
            isLast
          />
        </View>

        {/* Decorative padding to ensure corner plants are visible but clear of content */}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Bottom plants background decor */}
      <View style={styles.bottomDecorLeft} pointerEvents="none">
        <CornerPlant width={80} height={60} />
      </View>
      <View style={styles.bottomDecorRight} pointerEvents="none">
        <CornerPlant width={80} height={60} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SETTINGS_COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing['6xl'],
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: SETTINGS_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: SETTINGS_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: SETTINGS_COLORS.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SETTINGS_COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.primary,
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: SETTINGS_COLORS.secondary,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: typography.fontFamily.monoBold,
    color: SETTINGS_COLORS.secondary,
  },
  profileCard: {
    backgroundColor: SETTINGS_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    padding: 20,
    marginBottom: 20,
    shadowColor: SETTINGS_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SETTINGS_COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.primary,
    marginBottom: 2,
  },
  profileSub: {
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
    color: SETTINGS_COLORS.secondary,
  },
  profileDivider: {
    height: 1,
    backgroundColor: SETTINGS_COLORS.border,
    marginVertical: 16,
  },
  profileBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.secondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 22,
    fontFamily: typography.fontFamily.monoBold,
    color: SETTINGS_COLORS.primary,
  },
  profileEditBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
  },
  profileEditBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: SETTINGS_COLORS.primary,
  },
  statusBadge: {
    backgroundColor: SETTINGS_COLORS.lightGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusBadgeText: {
    color: SETTINGS_COLORS.green,
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
  privacyCard: {
    backgroundColor: SETTINGS_COLORS.lightGreen,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: SETTINGS_COLORS.border,
    padding: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: SETTINGS_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
});
