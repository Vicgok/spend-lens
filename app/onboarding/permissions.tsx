import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, {
  Rect,
  Circle,
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius, tokens, hexToRgba } from '@/theme';
import {
  checkSMSPermission,
  requestSMSPermission,
} from '@/features/sms-parser/sms-reader';
import SpendLensSmsModule from '../../modules/spendlens-sms-module';
import { LockIcon, ShieldIcon, CheckCircleIcon } from '@/components/ui';
import { useOnboardingStore } from '@/stores/settings-store';

// ── SMS Hero Illustration (Staticized) ──────────────────────────────────────
const SmsHeroIllustration = React.memo(() => {
  const { theme } = useTheme();
  const obTheme = theme.onboarding;

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const svgWidth = Math.min(SCREEN_WIDTH - 48, 390);
  const scale = svgWidth / 390;

  return (
    <View style={styles.heroContainer}>
      <Svg
        width={svgWidth}
        height={210 * scale}
        viewBox="0 0 390 210"
        style={styles.heroSvg}
      >
        <Defs>
          <SvgLinearGradient id="flowGrad" x1="114" y1="105" x2="198" y2="105" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={obTheme.primary} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={obTheme.primary} stopOpacity="0.15" />
          </SvgLinearGradient>
          <RadialGradient id="lensGlow" cx="222" cy="105" rx="44" ry="44" fx="222" fy="105" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={obTheme.primary} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={obTheme.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Dot texture grid */}
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => {
            if (row === 2 && col >= 3 && col <= 5) return null;
            return (
              <Circle
                key={`dot-${row}-${col}`}
                cx={col * 36 + 18}
                cy={row * 44 + 22}
                r={1}
                fill={obTheme.primary}
                opacity={0.35}
              />
            );
          })
        )}

        {/* ── Phone device ── */}
        <Rect x="38" y="42" width="76" height="116" rx="14" stroke={obTheme.primary} strokeWidth={1.4} fill="rgba(255,255,255,0.92)" />
        <Rect x="63" y="51" width="28" height="5" rx="2.5" stroke={obTheme.primary} strokeWidth={1.1} fill="none" opacity={0.5} />
        <Rect x="47" y="64" width="58" height="76" rx="7" stroke={obTheme.primary} strokeWidth={1.1} fill="rgba(255,255,255,0.8)" opacity={0.8} />

        {/* SMS message lines */}
        <Rect x="53" y="74" width="38" height="14" rx="5" fill={hexToRgba(obTheme.primary, 0.12)} stroke={hexToRgba(obTheme.primary, 0.3)} strokeWidth={1} />
        <Path d="M 57 81 h 18" stroke={obTheme.primary} strokeWidth={1.2} strokeLinecap="round" />
        <Rect x="53" y="94" width="32" height="12" rx="4" fill="rgba(255,255,255,0.4)" stroke={hexToRgba(obTheme.primary, 0.2)} strokeWidth={1} />
        <Path d="M 57 100 h 14" stroke={obTheme.primary} strokeWidth={1.1} strokeLinecap="round" opacity="0.6" />
        <Rect x="53" y="112" width="42" height="12" rx="4" fill="rgba(255,255,255,0.4)" stroke={hexToRgba(obTheme.primary, 0.2)} strokeWidth={1} />
        <Path d="M 57 118 h 22" stroke={obTheme.primary} strokeWidth={1.1} strokeLinecap="round" opacity="0.6" />
        <Rect x="69" y="147" width="14" height="3" rx="1.5" fill={obTheme.primary} opacity={0.25} />

        {/* ── Flow dots from phone to lens (Static) ── */}
        {Array.from({ length: 5 }).map((_, i) => {
          const cx = 114 + (i + 1) * 14;
          return (
            <Circle key={i} cx={cx} cy={105} r={2.8} fill={obTheme.primary} opacity={0.35} />
          );
        })}

        <Path d="M 114 105 L 198 105" stroke="url(#flowGrad)" strokeWidth={1.2} strokeDasharray="3 5" strokeLinecap="round" />

        {/* ── Lens ── */}
        <Circle cx="222" cy="105" r="44" fill="url(#lensGlow)" />
        <Circle cx="222" cy="105" r="32" stroke={obTheme.primary} strokeWidth={1.5} fill="rgba(255,255,255,0.92)" />
        <Circle cx="222" cy="105" r="18" stroke={obTheme.primary} strokeWidth={1} opacity={0.4} fill="none" />
        <Circle cx="222" cy="105" r={5} fill={obTheme.primary} opacity={0.7} />
        <Circle cx="229" cy="97" r={2.2} fill="white" opacity={0.6} />
        <Path d="M 247 128 L 262 143" stroke={obTheme.primary} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
        <Circle cx="266" cy="147" r={3} fill={obTheme.primary} opacity={0.5} />

        {/* ── Output insight tags ── */}
        <Path d="M 254 89 L 278 70" stroke={obTheme.primary} strokeWidth={0.8} strokeDasharray="2 4" opacity="0.35" />
        <Path d="M 254 105 L 278 105" stroke={obTheme.primary} strokeWidth={0.8} strokeDasharray="2 4" opacity="0.35" />
        <Path d="M 254 121 L 278 140" stroke={obTheme.primary} strokeWidth={0.8} strokeDasharray="2 4" opacity="0.35" />

        {/* Tag 1: Subscription */}
        <Rect x="278" y="56" width="92" height="28" rx="8" fill="rgba(255,255,255,0.92)" stroke={hexToRgba(obTheme.primary, 0.2)} strokeWidth={1} />
        <Circle cx="291" cy="70" r="5" fill={hexToRgba(obTheme.primary, 0.12)} />
        <Path d="M 289 70 a 4 4 0 0 1 4-4" stroke={obTheme.primary} strokeWidth={1.1} strokeLinecap="round" />
        <Path d="M 299 64 h 8" stroke={obTheme.primary} strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
        <Path d="M 299 70 h 14" stroke={obTheme.primary} strokeWidth={1} strokeLinecap="round" opacity={0.35} />

        {/* Tag 2: Income */}
        <Rect x="278" y="91" width="80" height="28" rx="8" fill="rgba(255,255,255,0.92)" stroke={hexToRgba(obTheme.primary, 0.2)} strokeWidth={1} />
        <Circle cx="291" cy="105" r="5" fill={hexToRgba(obTheme.primary, 0.12)} />
        <Path d="M 291 108 L 291 102 M 291 102 L 289 104 M 291 102 L 293 104" stroke={obTheme.primary} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M 299 102 h 10" stroke={obTheme.primary} strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
        <Path d="M 299 108 h 7" stroke={obTheme.primary} strokeWidth={1} strokeLinecap="round" opacity={0.35} />

        {/* Tag 3: Pattern */}
        <Rect x="278" y="126" width="88" height="28" rx="8" fill="rgba(255,255,255,0.92)" stroke={hexToRgba(obTheme.primary, 0.2)} strokeWidth={1} />
        <Circle cx="291" cy="140" r="5" fill={hexToRgba(obTheme.primary, 0.12)} />
        <Path d="M 287 142 L 289 139 L 291 141 L 294 136 L 296 138" stroke={obTheme.primary} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M 299 137 h 8" stroke={obTheme.primary} strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
        <Path d="M 299 143 h 12" stroke={obTheme.primary} strokeWidth={1} strokeLinecap="round" opacity={0.35} />

        {/* Ambient dots */}
        <Circle cx="36" cy="38" r="2.5" fill={obTheme.primary} opacity={0.3} />
        <Circle cx="362" cy="42" r="2" fill={obTheme.primary} opacity={0.28} />
        <Circle cx="48" cy="172" r="2" fill={obTheme.primary} opacity={0.25} />
        <Circle cx="356" cy="166" r={2.5} fill={obTheme.primary} opacity={0.3} />
      </Svg>
    </View>
  );
});

// ── Automation Flow Card ────────────────────────────────────────────────────
const AutomationFlowCard = React.memo(() => {
  const { theme } = useTheme();
  const obTheme = theme.onboarding;
  const steps = ['SMS', 'Scan', 'Insights', 'Savings'];
  return (
    <View style={[styles.flowCard, { backgroundColor: '#FFFFFF', borderColor: 'rgba(230, 230, 230, 0.9)' }]}>
      <Text style={[styles.flowCardTitle, { color: obTheme.primary, opacity: 0.7 }]}>
        AUTOMATION FLOW
      </Text>
      <View style={styles.flowCardRow}>
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <View style={[
              styles.flowCardStep,
              {
                backgroundColor: i === steps.length - 1 ? obTheme.brandGreen : '#F0F4EE',
                borderColor: 'rgba(230, 230, 230, 0.9)',
              }
            ]}>
              <Text style={[
                styles.flowCardStepText,
                {
                  color: i === steps.length - 1 ? obTheme.accentCardTitle : obTheme.primary,
                  fontFamily: i === steps.length - 1 ? typography.fontFamily.bold : typography.fontFamily.medium,
                }
              ]}>
                {step}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <Text style={[styles.flowCardArrow, { color: obTheme.primary, opacity: 0.5 }]}>➔</Text>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
});

// ── Privacy Manifest Card ────────────────────────────────────────────────────
const PrivacyManifestCard = React.memo(() => {
  const { theme } = useTheme();
  const obTheme = theme.onboarding;
  const points = [
    'Your financial data stays securely on your device.',
    'No cloud backups or remote servers. Zero external uploads.',
    'No third-party trackers. No selling data. Ever.',
  ];
  return (
    <View style={[styles.privacyManifestCard, { backgroundColor: '#FFFFFF', borderColor: 'rgba(230, 230, 230, 0.9)' }]}>
      <View style={styles.privacyManifestHeader}>
        <View style={[styles.privacyIconBox, { backgroundColor: hexToRgba(obTheme.brandGreen, 0.12), borderColor: hexToRgba(obTheme.brandGreen, 0.18) }]}>
          <LockIcon color={obTheme.brandGreen} size={14} />
        </View>
        <Text style={[styles.privacyManifestTitle, { color: obTheme.primary }]}>
          Your Privacy Manifest
        </Text>
      </View>
      <View style={styles.privacyManifestList}>
        {points.map((pt, index) => (
          <View key={index} style={styles.privacyManifestPoint}>
            <View style={[styles.privacyBullet, { backgroundColor: obTheme.primary }]} />
            <Text style={[styles.privacyPointText, { color: obTheme.primary, opacity: 0.85 }]}>
              {pt}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

type CustomAlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type CustomAlertConfig = {
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
  iconType?: 'info' | 'success' | 'warning' | 'shield';
};

// ── Main Permissions Screen Component ────────────────────────────────────────
export default function OnboardingPermissions() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig | null>(null);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isComplete = useOnboardingStore((s) => s.isComplete);
  const isHydrated = useOnboardingStore((s) => s.isHydrated);

  const logNavigation = (action: 'push' | 'replace' | 'back', target?: string) => {
    console.log(
      `[NAV_TRACE] screen=onboarding/permissions action=${action}${target ? ` target=${target}` : ''} state=${JSON.stringify({
        currentStep,
        isComplete,
        isHydrated,
      })}`
    );
  };

  const showCustomAlert = (
    title: string,
    message: string,
    buttons?: CustomAlertButton[],
    iconType?: 'info' | 'success' | 'warning' | 'shield'
  ) => {
    setCustomAlert({ title, message, buttons, iconType });
  };

  useEffect(() => {
    console.log(
      `[ROUTE_TRACE] mount screen=onboarding/permissions route=/onboarding/permissions state=${JSON.stringify({
        currentStep,
        isComplete,
        isHydrated,
      })}`
    );
    return () => {
      console.log('[ROUTE_TRACE] unmount screen=onboarding/permissions route=/onboarding/permissions');
    };
  }, []);

  useEffect(() => {
    console.log(
      `[ROUTE_TRACE] screen=onboarding/permissions state=${JSON.stringify({
        currentStep,
        isComplete,
        isHydrated,
        hasPermission,
        isChecking,
        hasCustomAlert: Boolean(customAlert),
      })}`
    );
  }, [currentStep, isComplete, isHydrated, hasPermission, isChecking, customAlert]);

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
      showCustomAlert(
        'SMS Reader',
        'Automatic SMS reading is only available on Android due to iOS platform restrictions. You can track expenses manually using the Add Transaction screen.',
        undefined,
        'info'
      );
      return;
    }

    if (!SpendLensSmsModule) {
      // Expo Go limitation: native SMS module not available
      showCustomAlert(
        'Expo Go Limitation',
        'SMS tracking requires custom native permissions which are not available in the generic Expo Go app. Build a standalone APK to enable real SMS tracking.',
        [
          {
            text: 'Continue',
            onPress: () => {
              logNavigation('push', '/onboarding/balance');
              router.push('/onboarding/balance');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ],
        'shield'
      );
      return;
    }

    try {
      const granted = await requestSMSPermission();
      setHasPermission(granted);
      if (granted) {
        showCustomAlert(
          'Permission Granted!',
          'SpendLens will now automatically scan financial messages when they arrive.',
          [
            {
              text: 'Continue',
              onPress: () => {
                logNavigation('push', '/onboarding/balance');
                router.push('/onboarding/balance');
              },
            }
          ],
          'success'
        );
      } else {
        showCustomAlert(
          'Permission Denied',
          'You can still add transactions manually. You can enable SMS tracking anytime in Settings.',
          undefined,
          'warning'
        );
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
    }
  };

  const obTheme = theme.onboarding;

  return (
    <View style={[styles.container, { backgroundColor: obTheme.background }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* ── Responsive Centered Scroll Container ────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <SmsHeroIllustration />

        {/* Editorial Header */}
        <View style={styles.header}>
          <Text style={[styles.microHeader, { color: obTheme.brandGreen }]}>DATA PERMISSIONS</Text>
          <Text style={[styles.title, { color: obTheme.primary, fontFamily: typography.fontFamily.bold }]}>
            Smart <Text style={{ color: obTheme.brandGreen }}>Auto</Text>-Tracking
          </Text>
          <Text style={[styles.subtitle, { color: obTheme.primary, opacity: 0.8 }]}>
            SpendLens reads incoming bank SMS messages to automate expense tracking — all processed locally on your device.
          </Text>
        </View>

        {/* Automation Flow */}
        <AutomationFlowCard />

        {/* Privacy Manifest */}
        <PrivacyManifestCard />

        {/* Action Buttons Section */}
        <View style={styles.bottomSection}>
          {isChecking ? (
            <ActivityIndicator size="large" color={obTheme.primary} style={{ marginVertical: 12 }} />
          ) : (
            <>
              {Platform.OS === 'android' && !hasPermission && (
                <Pressable
                  onPress={handleRequestPermission}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      borderColor: obTheme.primary,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <Text style={[styles.secondaryBtnText, { color: obTheme.primary }]}>
                    Enable SMS Tracking
                  </Text>
                </Pressable>
              )}

              {/* Primary CTA: always navigate to balance setup */}
              <Pressable
                onPress={() => {
                  logNavigation('push', '/onboarding/balance');
                  router.push('/onboarding/balance');
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: obTheme.primary,
                    shadowColor: obTheme.primary,
                  },
                  { transform: [{ scale: pressed ? 0.975 : 1 }] }
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: obTheme.accentCardTitle }]}>
                  Continue
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal
        visible={customAlert !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomAlert(null)}
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertCard, { backgroundColor: '#FAF9F7', borderColor: hexToRgba(obTheme.primary, 0.15) }]}>
            {/* Icon */}
            <View style={[styles.alertIconWrapper, { backgroundColor: hexToRgba(obTheme.primary, 0.08) }]}>
              {customAlert?.iconType === 'success' ? (
                <CheckCircleIcon color={obTheme.brandGreen} size={28} />
              ) : (
                <ShieldIcon color={obTheme.primary} size={28} />
              )}
            </View>

            {/* Title */}
            <Text style={[styles.alertTitle, { color: obTheme.primary }]}>
              {customAlert?.title}
            </Text>

            {/* Message */}
            <Text style={[styles.alertMessage, { color: obTheme.mutedText }]}>
              {customAlert?.message}
            </Text>

            {/* Buttons */}
            <View style={styles.alertButtonContainer}>
              {customAlert?.buttons && customAlert.buttons.length > 0 ? (
                customAlert.buttons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setCustomAlert(null);
                        if (btn.onPress) btn.onPress();
                      }}
                      style={({ pressed }) => [
                        isCancel ? styles.alertBtnSecondary : styles.alertBtnPrimary,
                        !isCancel && { backgroundColor: obTheme.primary },
                        isCancel && { borderColor: obTheme.primary },
                        { transform: [{ scale: pressed ? 0.98 : 1 }] }
                      ]}
                    >
                      <Text style={[
                        isCancel ? styles.alertBtnTextSecondary : styles.alertBtnTextPrimary,
                        !isCancel && { color: '#FAF9F7' },
                        isCancel && { color: obTheme.primary }
                      ]}>
                        {btn.text}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <Pressable
                  onPress={() => setCustomAlert(null)}
                  style={({ pressed }) => [
                    styles.alertBtnPrimary,
                    { backgroundColor: obTheme.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }
                  ]}
                >
                  <Text style={[styles.alertBtnTextPrimary, { color: '#FAF9F7' }]}>
                    OK
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Scroll container ──
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 16,
  },

  // ── Hero ──
  heroContainer: {
    height: 210,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  heroSvg: {
    position: 'absolute',
  },

  // ── Header ──
  header: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  microHeader: {
    fontSize: typography.sizes.micro,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  // ── Automation Flow Card ──
  flowCard: {
    borderWidth: 1,
    borderRadius: tokens.radii.input,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  flowCardTitle: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  flowCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowCardStep: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowCardStepText: {
    fontSize: 12,
  },
  flowCardArrow: {
    fontSize: 12,
  },

  // ── Privacy Manifest Card ──
  privacyManifestCard: {
    borderWidth: 1,
    borderRadius: tokens.radii.input,
    padding: spacing.base,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  privacyManifestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 10,
  },
  privacyIconBox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyManifestTitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    lineHeight: 18,
  },
  privacyManifestList: {
    gap: 7,
  },
  privacyManifestPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  privacyBullet: {
    width: 5,
    height: 5,
    borderRadius: 1.5,
    marginTop: 6,
  },
  privacyPointText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  // ── Action Buttons ──
  bottomSection: {
    gap: 10,
    marginTop: spacing.sm,
  },
  primaryButton: {
    height: 54,
    borderRadius: tokens.radii.input,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
    width: '100%',
  },
  primaryBtnText: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.1,
  },
  secondaryButton: {
    height: 54,
    borderRadius: tokens.radii.input,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
    width: '100%',
  },
  secondaryBtnText: {
    fontSize: 15,
    letterSpacing: 0.1,
    fontFamily: typography.fontFamily.bold,
  },

  // ── Custom Alert Styles ──
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 10, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 328,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  alertIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    fontSize: typography.sizes.section,
    textAlign: 'center',
    marginTop: spacing.base,
  },
  alertMessage: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  alertButtonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  alertBtnPrimary: {
    height: 48,
    borderRadius: borderRadius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  alertBtnSecondary: {
    height: 48,
    borderRadius: borderRadius.md + 2,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  alertBtnTextPrimary: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    fontSize: 14,
  },
  alertBtnTextSecondary: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    fontSize: 14,
  },
});
