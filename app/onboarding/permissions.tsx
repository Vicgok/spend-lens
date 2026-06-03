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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import {
  checkSMSPermission,
  requestSMSPermission,
  simulateSMSScan,
} from '@/features/sms-parser/sms-reader';

export default function OnboardingPermissions() {
  const { theme } = useTheme();
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
        'Automatic SMS reading is only available on Android due to iOS platform restrictions. On iOS, you can track expenses manually or sync via email (coming soon!).'
      );
      return;
    }

    // Check if running in Expo Go (which lacks the native module)
    if (!NativeModules.RNExpoReadSms) {
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
    // Add artificial delay for premium look & feel
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={[styles.title, { color: theme.text }]}>
          Smart Auto-Tracking
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          SpendLens can parse incoming SMS notifications from your bank or credit card to automatically record expenses in real-time.
        </Text>
      </View>

      {/* Info Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>🔒 Privacy First</Text>
        <View style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
            All parsing happens on your device.
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
            No messages are sent to any server.
          </Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
            Personal texts and OTPs are ignored.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.bottomSection}>
        {isChecking ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <>
            {Platform.OS === 'android' && !hasPermission && (
              <Pressable onPress={handleRequestPermission} style={styles.btnWrapper}>
                <LinearGradient
                  colors={theme.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryBtnText}>Enable SMS Tracking</Text>
                </LinearGradient>
              </Pressable>
            )}

            <Pressable
              onPress={handleSimulateScan}
              disabled={isScanning}
              style={[styles.outlineButton, { borderColor: theme.primary }]}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={[styles.outlineBtnText, { color: theme.primary }]}>
                  {Platform.OS === 'ios' ? 'Try Demo Scan (Simulate)' : 'Try Demo Scan'}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: theme.textMuted }]}>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes['2xl'],
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: 40,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
    marginBottom: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  bullet: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bulletText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 16,
  },
  btnWrapper: {
    width: '100%',
  },
  primaryButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
    color: '#FFFFFF',
  },
  outlineButton: {
    width: '100%',
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
  },
});
