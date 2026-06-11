import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  NativeModules,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing } from '@/theme';
import {
  checkSMSPermission,
  requestSMSPermission,
  simulateSMSScan,
} from '@/features/sms-parser/sms-reader';
import SpendLensSmsModule from '../../modules/spendlens-sms-module';


export default function OnboardingPermissions() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    async function verifyPermission() {
      if (Platform.OS === 'android') {
        const result = await checkSMSPermission();
        setHasPermission(result);
      }
      setIsChecking(false);
    }
    verifyPermission();
  }, []);

  const handleRequestPermission = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'SMS Reader',
        'Automatic SMS reading is only available on Android due to iOS platform restrictions. On iOS, you can track expenses manually or simulate tracking via Demo Scan.'
      );
      return;
    }

    if (!SpendLensSmsModule) {
      Alert.alert(
        'Expo Go Limitation',
        'SMS tracking requires custom native permissions which are not available in the generic Expo Go app. To test the SMS parsing, please tap "Try Demo Scan" or build a standalone APK.',
        [
          { text: 'Try Demo Scan', onPress: () => handleSimulateScan() },
          { text: 'Continue Manually', onPress: () => router.push('/onboarding/balance') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    try {
      const granted = await requestSMSPermission();
      setHasPermission(granted);
      if (granted) {
        Alert.alert(
          'Permission Granted!',
          'SpendLens will now automatically scan financial messages when they arrive.'
        );
        router.push('/onboarding/balance');
      } else {
        Alert.alert(
          'Permission Denied',
          'You can still add transactions manually. You can enable SMS tracking anytime in settings.'
        );
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
    }
  };

  const handleSimulateScan = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      try {
        const addedCount = await simulateSMSScan();
        setIsScanning(false);
        Alert.alert(
          'Scan Complete!',
          `Successfully simulated scanning SMS and created ${addedCount} transactions with smart auto-categorization.`,
          [
            {
              text: 'Awesome',
              onPress: () => router.push('/onboarding/balance'),
            },
          ]
        );
      } catch (error) {
        console.error('Failed to simulate scan:', error);
        setIsScanning(false);
      }
    }, 1500);
  };

  const handleSkip = () => {
    router.push('/onboarding/balance');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 20) }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      {/* Editorial Header */}
      <View style={styles.header}>
        <Text style={[styles.microHeader, { color: theme.textSecondary }]}>DATA PERMISSIONS</Text>
        <Text style={[styles.title, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
          Smart Auto-Tracking
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          SpendLens reads incoming bank SMS messages to automate expense tracking.
        </Text>
      </View>

      {/* Horizontal Illustrated Flow */}
      <View style={[styles.flowContainer, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[styles.flowTitle, { color: theme.textSecondary, fontFamily: typography.fontFamily.bold }]}>
          AUTOMATION FLOW
        </Text>
        <View style={styles.flowRow}>
          <View style={[styles.flowStep, { borderColor: theme.border }]}>
            <Text style={[styles.stepText, { color: theme.text }]}>SMS</Text>
          </View>
          <Text style={[styles.flowArrow, { color: theme.textSecondary }]}>➔</Text>
          <View style={[styles.flowStep, { borderColor: theme.border }]}>
            <Text style={[styles.stepText, { color: theme.text }]}>Tx</Text>
          </View>
          <Text style={[styles.flowArrow, { color: theme.textSecondary }]}>➔</Text>
          <View style={[styles.flowStep, { borderColor: theme.border }]}>
            <Text style={[styles.stepText, { color: theme.text }]}>Insights</Text>
          </View>
          <Text style={[styles.flowArrow, { color: theme.textSecondary }]}>➔</Text>
          <View style={[styles.flowStep, { borderColor: theme.border, backgroundColor: theme.primary }]}>
            <Text style={[styles.stepText, { color: '#1B1B1B', fontFamily: typography.fontFamily.bold }]}>Savings</Text>
          </View>
        </View>
      </View>

      {/* Privacy Guarantee List (Swiss Paper Card) */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
          🔒 Your Privacy Manifest
        </Text>
        <View style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: theme.text }]}>■</Text>
          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
            Your financial data stays securely on your device.
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: theme.text }]}>■</Text>
          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
            No cloud backups or remote servers. Zero external uploads.
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: theme.text }]}>■</Text>
          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
            No third-party trackers. No selling data. Ever.
          </Text>
        </View>
      </View>

      {/* Action CTA Buttons */}
      <View style={styles.bottomSection}>
        {isChecking ? (
          <ActivityIndicator size="large" color={theme.text} />
        ) : (
          <>
            {Platform.OS === 'android' && !hasPermission && (
              <Pressable
                onPress={handleRequestPermission}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.text,
                    borderColor: theme.border,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: theme.background, fontFamily: typography.fontFamily.bold }]}>
                  Enable SMS Tracking
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleSimulateScan}
              disabled={isScanning}
              style={({ pressed }) => [
                styles.outlineButton,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.primary,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color="#1B1B1B" />
              ) : (
                <Text style={[styles.outlineBtnText, { color: '#1B1B1B', fontFamily: typography.fontFamily.bold }]}>
                  {Platform.OS === 'ios' ? 'Try Demo Scan (Simulate)' : 'Try Demo Scan'}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: theme.textSecondary }]}>
                {Platform.OS === 'ios' ? 'Skip & Continue' : "I'll do it manually"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 20,
  },
  header: {
    marginBottom: 10,
    alignItems: 'center',
  },
  microHeader: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  flowContainer: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
  },
  flowTitle: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 12,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowStep: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 11,
  },
  flowArrow: {
    fontSize: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 8,
    marginTop: 4,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  bottomSection: {
    gap: 12,
  },
  primaryButton: {
    height: 56,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  outlineButton: {
    height: 56,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
  },
});
