import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Rect,
  Circle,
  Path,
  Line,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing, borderRadius } from '@/theme';
import {
  checkSMSPermission,
  requestSMSPermission,
  simulateSMSScan,
} from '@/features/sms-parser/sms-reader';
import SpendLensSmsModule from '../../modules/spendlens-sms-module';

const BRAND_GREEN = '#7BCB4C';
const BRAND_GREEN_DARK = '#4CAF50';
const NEAR_BLACK = '#1E1E1E';
const WARM_BG = '#FAF9F7';
const SUBTLE_GRAY = '#5B5B5B';
const MUTED_GRAY = '#6B6B6B';
const PILL_INACTIVE = '#D4D4D4';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── SMS Hero Illustration ──────────────────────────────────────────────────
function SmsHeroIllustration() {
  const dotAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    dotAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 280),
          Animated.timing(anim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

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
            <Stop offset="0%" stopColor="#7BCB4C" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#7BCB4C" stopOpacity={0.15} />
          </SvgLinearGradient>
          <RadialGradient id="lensGlow" cx="222" cy="105" rx="44" ry="44" fx="222" fy="105" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#7BCB4C" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#7BCB4C" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Dot texture grid */}
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => (
            <Circle
              key={`dot-${row}-${col}`}
              cx={col * 36 + 18}
              cy={row * 44 + 22}
              r={1}
              fill="#7BCB4C"
              opacity={0.15}
            />
          ))
        )}

        {/* ── Phone device ── */}
        <Rect x="38" y="42" width="76" height="116" rx="14" stroke="#1E1E1E" strokeWidth={1.4} fill="rgba(250,249,247,0.9)" />
        <Rect x="63" y="51" width="28" height="5" rx="2.5" stroke="#1E1E1E" strokeWidth={1.1} fill="none" opacity={0.5} />
        <Rect x="47" y="64" width="58" height="76" rx="7" stroke="#1E1E1E" strokeWidth={1.1} fill="rgba(246,248,245,0.7)" opacity={0.8} />
        {/* SMS message lines */}
        <Rect x="53" y="74" width="38" height="14" rx="5" fill="rgba(123,203,76,0.18)" stroke="rgba(123,203,76,0.3)" strokeWidth={1} />
        <Path d="M 57 81 h 18" stroke="#4CAF50" strokeWidth={1.2} strokeLinecap="round" />
        <Rect x="53" y="94" width="32" height="12" rx="4" fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
        <Path d="M 57 100 h 14" stroke="#5B5B5B" strokeWidth={1.1} strokeLinecap="round" opacity="0.6" />
        <Rect x="53" y="112" width="42" height="12" rx="4" fill="rgba(0,0,0,0.04)" stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
        <Path d="M 57 118 h 22" stroke="#5B5B5B" strokeWidth={1.1} strokeLinecap="round" opacity="0.6" />
        <Rect x="69" y="147" width="14" height="3" rx="1.5" fill="#1E1E1E" opacity="0.25" />

        {/* ── Flow dots from phone to lens ── */}
        {dotAnims.map((anim, i) => {
          const cx = 114 + (i + 1) * 14;
          return (
            <AnimatedCircle
              key={i}
              cx={cx}
              cy={105}
              r={2.8}
              fill="#7BCB4C"
              opacity={anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.7, 0],
              })}
            />
          );
        })}

        <Path d="M 114 105 L 198 105" stroke="url(#flowGrad)" strokeWidth={1.2} strokeDasharray="3 5" strokeLinecap="round" />

        {/* ── Lens ── */}
        <Circle cx="222" cy="105" r="44" fill="url(#lensGlow)" />
        <Circle cx="222" cy="105" r="32" stroke="#7BCB4C" strokeWidth={1.5} fill="rgba(246,250,243,0.92)" />
        <Circle cx="222" cy="105" r="18" stroke="#7BCB4C" strokeWidth={1} opacity={0.4} fill="none" />
        <Circle cx="222" cy="105" r={5} fill="#7BCB4C" opacity={0.7} />
        <Circle cx="229" cy="97" r={2.2} fill="white" opacity={0.6} />
        <Path d="M 247 128 L 262 143" stroke="#7BCB4C" strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
        <Circle cx="266" cy="147" r={3} fill="#7BCB4C" opacity={0.5} />

        {/* ── Output insight tags ── */}
        <Path d="M 254 89 L 278 70" stroke="#7BCB4C" strokeWidth={0.8} strokeDasharray="2 4" opacity="0.35" />
        <Path d="M 254 105 L 278 105" stroke="#7BCB4C" strokeWidth={0.8} strokeDasharray="2 4" opacity="0.35" />
        <Path d="M 254 121 L 278 140" stroke="#7BCB4C" strokeWidth={0.8} strokeDasharray="2 4" opacity="0.35" />

        {/* Tag 1: Subscription */}
        <Rect x="278" y="56" width="92" height="28" rx="8" fill="rgba(255,255,255,0.88)" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
        <Circle cx="291" cy="70" r="5" fill="rgba(123,203,76,0.18)" />
        <Path d="M 289 70 a 4 4 0 0 1 4-4" stroke="#4CAF50" strokeWidth={1.1} strokeLinecap="round" />
        <Path d="M 299 64 h 8" stroke="#1E1E1E" strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
        <Path d="M 299 70 h 14" stroke="#1E1E1E" strokeWidth={1} strokeLinecap="round" opacity="0.35" />

        {/* Tag 2: Income */}
        <Rect x="278" y="91" width="80" height="28" rx="8" fill="rgba(123,203,76,0.12)" stroke="rgba(123,203,76,0.25)" strokeWidth={1} />
        <Circle cx="291" cy="105" r="5" fill="rgba(76,175,80,0.2)" />
        <Path d="M 291 108 L 291 102 M 291 102 L 289 104 M 291 102 L 293 104" stroke="#4CAF50" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M 299 102 h 10" stroke="#1E1E1E" strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
        <Path d="M 299 108 h 7" stroke="#1E1E1E" strokeWidth={1} strokeLinecap="round" opacity="0.35" />

        {/* Tag 3: Pattern */}
        <Rect x="278" y="126" width="88" height="28" rx="8" fill="rgba(255,255,255,0.88)" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
        <Circle cx="291" cy="140" r="5" fill="rgba(123,203,76,0.18)" />
        <Path d="M 287 142 L 289 139 L 291 141 L 294 136 L 296 138" stroke="#7BCB4C" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M 299 137 h 8" stroke="#1E1E1E" strokeWidth={1.1} strokeLinecap="round" opacity={0.7} />
        <Path d="M 299 143 h 12" stroke="#1E1E1E" strokeWidth={1} strokeLinecap="round" opacity="0.35" />

        {/* Ambient dots */}
        <Circle cx="36" cy="38" r="2.5" fill="#7BCB4C" opacity="0.3" />
        <Circle cx="362" cy="42" r="2" fill="#7BCB4C" opacity="0.28" />
        <Circle cx="48" cy="172" r="2" fill="#7BCB4C" opacity="0.25" />
        <Circle cx="356" cy="166" r="2.5" fill="#7BCB4C" opacity="0.3" />
      </Svg>
    </View>
  );
}

// ── Automation Flow Card ────────────────────────────────────────────────────
function AutomationFlowCard({ theme }: { theme: any }) {
  const steps = ['SMS', 'Scan', 'Insights', 'Savings'];
  return (
    <View style={[styles.flowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.flowCardTitle, { color: theme.textMuted }]}>
        AUTOMATION FLOW
      </Text>
      <View style={styles.flowCardRow}>
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <View style={[
              styles.flowCardStep,
              {
                backgroundColor: i === steps.length - 1 ? '#7BCB4C' : theme.surfaceElevated,
                borderColor: theme.border,
              }
            ]}>
              <Text style={[
                styles.flowCardStepText,
                {
                  color: i === steps.length - 1 ? 'white' : theme.text,
                  fontFamily: i === steps.length - 1 ? typography.fontFamily.bold : typography.fontFamily.medium,
                }
              ]}>
                {step}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <Text style={[styles.flowCardArrow, { color: theme.textMuted }]}>➔</Text>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ── Privacy Manifest Card ────────────────────────────────────────────────────
function PrivacyManifestCard({ theme }: { theme: any }) {
  const points = [
    'Your financial data stays securely on your device.',
    'No cloud backups or remote servers. Zero external uploads.',
    'No third-party trackers. No selling data. Ever.',
  ];
  return (
    <View style={[styles.privacyManifestCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.privacyManifestHeader}>
        <View style={styles.privacyIconBox}>
          <Text style={{ fontSize: 13 }}>🔒</Text>
        </View>
        <Text style={[styles.privacyManifestTitle, { color: theme.text }]}>
          Your Privacy Manifest
        </Text>
      </View>
      <View style={styles.privacyManifestList}>
        {points.map((pt, index) => (
          <View key={index} style={styles.privacyManifestPoint}>
            <View style={styles.privacyBullet} />
            <Text style={[styles.privacyPointText, { color: theme.textSecondary }]}>
              {pt}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Logo Mark ────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <View style={styles.logoRow}>
      <Svg width={34} height={34} viewBox="0 0 34 34" fill="none">
        <Rect width={34} height={34} rx={9} fill={BRAND_GREEN} />
        <Circle cx={17} cy={17} r={8} stroke="white" strokeWidth={1.6} />
        <Circle cx={17} cy={17} r={3.2} fill="white" />
        <Circle cx={20} cy={14} r={1.2} fill="white" opacity={0.6} />
      </Svg>
      <Text style={styles.logoText}>SpendLens</Text>
    </View>
  );
}

// ── Main Permissions Screen Component ────────────────────────────────────────
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
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : WARM_BG, paddingTop: insets.top + 8 }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <LogoMark />

        {/* Progress pills */}
        <View style={styles.progressPills}>
          <View style={[styles.pillInactive, { backgroundColor: PILL_INACTIVE }]} />
          <View style={[styles.pillActive, { backgroundColor: BRAND_GREEN }]} />
          <View style={[styles.pillInactive, { backgroundColor: PILL_INACTIVE }]} />
        </View>

        {/* Skip */}
        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

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
          <Text style={[styles.microHeader, { color: BRAND_GREEN }]}>DATA PERMISSIONS</Text>
          <Text style={[styles.title, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
            Smart <Text style={{ color: BRAND_GREEN }}>Auto</Text>-Tracking
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            SpendLens reads incoming bank SMS messages to automate expense tracking — all processed locally on your device.
          </Text>
        </View>

        {/* Automation Flow */}
        <AutomationFlowCard theme={theme} />

        {/* Privacy Manifest */}
        <PrivacyManifestCard theme={theme} />

        {/* Action Buttons Section */}
        <View style={styles.bottomSection}>
          {isChecking ? (
            <ActivityIndicator size="large" color={theme.text} style={{ marginVertical: 12 }} />
          ) : (
            <>
              {Platform.OS === 'android' && !hasPermission && (
                <Pressable
                  onPress={handleRequestPermission}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <Text style={[styles.secondaryBtnText, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
                    Enable SMS Tracking
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleSimulateScan}
                disabled={isScanning}
                style={({ pressed }) => [
                  styles.ctaButtonWrapper,
                  { transform: [{ scale: pressed ? 0.975 : 1 }] }
                ]}
              >
                <LinearGradient
                  colors={theme.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.primaryButton, isScanning && styles.ctaDisabled]}
                >
                  {isScanning ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      Try Demo Scan
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text style={[styles.skipButtonText, { color: theme.textMuted }]}>
                  {Platform.OS === 'ios' ? 'Skip & Continue' : "I'll do it manually"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
    color: NEAR_BLACK,
    letterSpacing: -0.2,
  },
  progressPills: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  pillActive: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  pillInactive: {
    width: 8,
    height: 4,
    borderRadius: 2,
  },
  skipText: {
    color: SUBTLE_GRAY,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    fontSize: 14,
    letterSpacing: -0.1,
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
    marginVertical: 4,
  },
  microHeader: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
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
    borderRadius: 18,
    paddingHorizontal: 16,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  privacyManifestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  privacyIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyManifestTitle: {
    fontSize: 13,
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
    gap: 8,
  },
  privacyBullet: {
    width: 5,
    height: 5,
    borderRadius: 1.5,
    backgroundColor: '#7BCB4C',
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
    marginTop: 8,
  },
  ctaButtonWrapper: {
    width: '100%',
  },
  primaryButton: {
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgb(103, 191, 56)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.bold,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.1,
  },
  secondaryButton: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  secondaryBtnText: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
  },
});
