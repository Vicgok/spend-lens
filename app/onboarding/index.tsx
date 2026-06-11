import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography } from '@/theme';
import Svg, {
  Rect,
  Circle,
  Ellipse,
  Path,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 300;

// ── Color constants matching the Figma design ──────────────────────────────
const BRAND_GREEN = '#7BCB4C';
const BRAND_GREEN_DARK = '#4CAF50';
const NEAR_BLACK = '#1E1E1E';
const WARM_BG = '#FAF9F7';
const SUBTLE_GRAY = '#5B5B5B';
const MUTED_GRAY = '#6B6B6B';
const DOT_AMBER = '#F59E0B';
const DOT_GRAY = '#9CA3AF';
const PILL_INACTIVE = '#D4D4D4';

// ── Signal Card Data ───────────────────────────────────────────────────────
type SignalCardData = {
  icon: string;
  label: string;
  sublabel: string;
  dotColor: string;
  accent?: boolean;
  position: { top?: number; bottom?: number; left?: number; right?: number };
  floatDelay: number;
};

const SIGNAL_CARDS: SignalCardData[] = [
  {
    icon: '📅',
    label: 'Bill Due',
    sublabel: 'Electricity · 3 days',
    dotColor: DOT_AMBER,
    position: { top: 10, left: 4 },
    floatDelay: 0,
  },
  {
    icon: '🔄',
    label: 'Subscription',
    sublabel: 'Netflix · $15.99',
    dotColor: DOT_GRAY,
    position: { top: 22, right: 4 },
    floatDelay: 400,
  },
  {
    icon: '🛡️',
    label: 'Protected',
    sublabel: 'Activity normal',
    dotColor: BRAND_GREEN_DARK,
    accent: true,
    position: { top: 120, left: 0 },
    floatDelay: 200,
  },
  {
    icon: '⬆',
    label: 'Salary In',
    sublabel: '+₹3,200 received',
    dotColor: BRAND_GREEN_DARK,
    accent: true,
    position: { top: 124, right: 0 },
    floatDelay: 600,
  },
  {
    icon: '◎',
    label: 'All Clear',
    sublabel: 'No anomalies found',
    dotColor: BRAND_GREEN_DARK,
    position: { bottom: 20, left: 4 },
    floatDelay: 300,
  },
  {
    icon: '📈',
    label: 'Spending Up',
    sublabel: '18% vs last week',
    dotColor: DOT_AMBER,
    position: { bottom: 16, right: 4 },
    floatDelay: 500,
  },
];

// ── Floating Signal Card Component ─────────────────────────────────────────
function SignalCard({
  card,
  enterDelay,
}: {
  card: SignalCardData;
  enterDelay: number;
}) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 500,
      delay: enterDelay + 300,
      useNativeDriver: true,
    }).start();

    // Continuous float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1800,
          delay: card.floatDelay,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const cardBg = card.accent
    ? 'rgba(123, 203, 76, 0.12)'
    : 'rgba(255, 255, 255, 0.88)';
  const cardBorder = card.accent
    ? 'rgba(123, 203, 76, 0.28)'
    : 'rgba(230, 230, 230, 0.9)';
  const iconBg = card.accent ? 'rgba(123,203,76,0.2)' : '#F0F4EE';

  return (
    <Animated.View
      style={[
        styles.signalCard,
        card.position,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          opacity: enterAnim,
          transform: [
            {
              translateY: Animated.add(
                floatAnim,
                enterAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                })
              ),
            },
            {
              scale: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1],
              }),
            },
          ],
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.signalIconBox, { backgroundColor: iconBg }]}>
        <Text style={styles.signalIconEmoji}>{card.icon}</Text>
      </View>

      {/* Text */}
      <View style={styles.signalTextBox}>
        <View style={styles.signalLabelRow}>
          <Text style={styles.signalLabel}>{card.label}</Text>
          <View
            style={[styles.signalDot, { backgroundColor: card.dotColor }]}
          />
        </View>
        <Text style={styles.signalSublabel} numberOfLines={1}>
          {card.sublabel}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Hero Illustration with Walking Figure ──────────────────────────────────
function HeroIllustration() {
  // Pulse ring animations
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse1, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.timing(pulse2, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }, 1500);
  }, []);

  // Scale the SVG to screen width
  const svgWidth = SCREEN_WIDTH;
  const svgHeight = HERO_HEIGHT;
  const scale = svgWidth / 390;
  const centerX = 195;
  const centerY = 172;

  return (
    <View style={styles.heroContainer}>
      {/* Pulse rings (behind SVG) */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            top: centerY * scale - 70,
            left: centerX * scale - 70,
            width: 140,
            height: 140,
            borderColor: BRAND_GREEN,
            opacity: pulse1.interpolate({
              inputRange: [0, 1],
              outputRange: [0.28, 0],
            }),
            transform: [
              {
                scale: pulse1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1.4],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pulseRing,
          {
            top: centerY * scale - 70,
            left: centerX * scale - 70,
            width: 140,
            height: 140,
            borderColor: BRAND_GREEN,
            opacity: pulse2.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0],
            }),
            transform: [
              {
                scale: pulse2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1.4],
                }),
              },
            ],
          },
        ]}
      />

      {/* Figure SVG */}
      <Svg
        width={svgWidth}
        height={svgHeight}
        viewBox="0 0 390 324"
        style={styles.heroSvg}
      >
        <Defs>
          <LinearGradient
            id="trailGrad"
            x1="0"
            y1="1"
            x2="0"
            y2="0"
            gradientUnits="objectBoundingBox"
          >
            <Stop offset="0%" stopColor={BRAND_GREEN} stopOpacity={0.5} />
            <Stop offset="100%" stopColor={BRAND_GREEN} stopOpacity={0.1} />
          </LinearGradient>
        </Defs>

        {/* Dot texture grid */}
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => (
            <Circle
              key={`dot-${row}-${col}`}
              cx={col * 36 + 18}
              cy={row * 42 + 21}
              r={1}
              fill={BRAND_GREEN}
              opacity={0.18}
            />
          ))
        )}

        {/* Walking trail S-curve */}
        <Path
          d="M 178 310 C 184 278, 195 248, 195 210 C 195 172, 196 142, 208 106"
          stroke="url(#trailGrad)"
          strokeWidth={1.8}
          strokeDasharray="4 8"
          strokeLinecap="round"
        />

        {/* Connector lines to card positions */}
        <Line x1={174} y1={152} x2={154} y2={138} stroke={BRAND_GREEN} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={216} y1={152} x2={236} y2={138} stroke={BRAND_GREEN} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={172} y1={170} x2={150} y2={168} stroke={BRAND_GREEN} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={218} y1={170} x2={240} y2={168} stroke={BRAND_GREEN} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={182} y1={218} x2={157} y2={240} stroke={BRAND_GREEN} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={208} y1={218} x2={233} y2={240} stroke={BRAND_GREEN} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />

        {/* Cute Cartoon Mascot Figure (Monochrome) */}
        {/* Mascot Body Shadow */}
        <Ellipse cx={195} cy={278} rx={22} ry={5} fill="rgba(0,0,0,0.06)" />

        {/* Head glow */}
        <Circle cx={195} cy={165} r={36} fill="rgba(123,203,76,0.06)" />

        {/* Mascot Body */}
        <Path 
          d="M 175 190 C 160 210, 160 245, 175 260 C 185 270, 205 270, 215 260 C 230 245, 230 210, 215 190 Z" 
          fill="#FAF9F7" 
          stroke={NEAR_BLACK} 
          strokeWidth={1.8} 
        />
        {/* Mascot belly patch */}
        <Ellipse cx={195} cy={230} rx={16} ry={22} fill="rgba(123, 203, 76, 0.15)" />

        {/* Mascot Head */}
        <Circle cx={195} cy={160} r={28} fill="#FAF9F7" stroke={NEAR_BLACK} strokeWidth={1.8} />

        {/* Mascot Face Details */}
        {/* Blush */}
        <Circle cx={178} cy={164} r={3.5} fill={BRAND_GREEN} opacity={0.4} />
        <Circle cx={212} cy={164} r={3.5} fill={BRAND_GREEN} opacity={0.4} />
        {/* Large Cute Anime Eyes */}
        <Circle cx={183} cy={157} r={4.5} fill={NEAR_BLACK} />
        <Circle cx={207} cy={157} r={4.5} fill={NEAR_BLACK} />
        {/* Eye Shine / Sparkle */}
        <Circle cx={181.5} cy={155.5} r={1.5} fill="white" />
        <Circle cx={205.5} cy={155.5} r={1.5} fill="white" />
        {/* Smiling Mouth */}
        <Path d="M 191 166 Q 195 171 199 166" stroke={NEAR_BLACK} strokeWidth={1.8} strokeLinecap="round" fill="none" />

        {/* Cute Mascot Antenna */}
        <Path d="M 195 132 L 195 122" stroke={NEAR_BLACK} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={195} cy={119} r={4.5} fill={BRAND_GREEN} stroke={NEAR_BLACK} strokeWidth={1.5} />

        {/* Mascot Arms */}
        {/* Left Arm waving */}
        <Path 
          d="M 168 205 C 152 200, 142 190, 138 177" 
          stroke={NEAR_BLACK} 
          strokeWidth={4} 
          strokeLinecap="round" 
          fill="none" 
        />
        <Circle cx={138} cy={177} r={3} fill={BRAND_GREEN} stroke={NEAR_BLACK} strokeWidth={1.5} />

        {/* Right Arm waving or resting */}
        <Path 
          d="M 222 205 C 235 210, 245 215, 252 227" 
          stroke={NEAR_BLACK} 
          strokeWidth={4} 
          strokeLinecap="round" 
          fill="none" 
        />
        <Circle cx={252} cy={227} r={3} fill={BRAND_GREEN} stroke={NEAR_BLACK} strokeWidth={1.5} />

        {/* Mascot Legs */}
        {/* Left Leg */}
        <Path d="M 182 262 L 180 278" stroke={NEAR_BLACK} strokeWidth={4.5} strokeLinecap="round" />
        <Path d="M 174 278 L 183 278" stroke={NEAR_BLACK} strokeWidth={4} strokeLinecap="round" />

        {/* Right Leg */}
        <Path d="M 208 262 L 210 278" stroke={NEAR_BLACK} strokeWidth={4.5} strokeLinecap="round" />
        <Path d="M 207 278 L 216 278" stroke={NEAR_BLACK} strokeWidth={4} strokeLinecap="round" />

        {/* Floating ambient dots */}
        <Circle cx={152} cy={80} r={3} fill={BRAND_GREEN} opacity={0.42} />
        <Circle cx={138} cy={108} r={1.8} fill={BRAND_GREEN} opacity={0.28} />
        <Circle cx={148} cy={244} r={2.2} fill={BRAND_GREEN} opacity={0.32} />
        <Circle cx={244} cy={86} r={2.5} fill={BRAND_GREEN} opacity={0.38} />
        <Circle cx={258} cy={112} r={1.6} fill={BRAND_GREEN} opacity={0.25} />
        <Circle cx={248} cy={252} r={2.8} fill={BRAND_GREEN} opacity={0.35} />
        <Circle cx={195} cy={72} r={3.5} fill={BRAND_GREEN} opacity={0.25} />

        {/* Sparkle – top left */}
        <Path d="M 144 68 L 148 64 L 144 60" stroke={BRAND_GREEN} strokeWidth={1.1} strokeLinecap="round" opacity={0.38} />
        <Path d="M 148 64 L 153 64" stroke={BRAND_GREEN} strokeWidth={1.1} strokeLinecap="round" opacity={0.38} />

        {/* Sparkle – top right */}
        <Path d="M 246 62 L 250 58 L 246 54" stroke={BRAND_GREEN} strokeWidth={1.1} strokeLinecap="round" opacity={0.32} />
        <Path d="M 250 58 L 255 58" stroke={BRAND_GREEN} strokeWidth={1.1} strokeLinecap="round" opacity={0.32} />
      </Svg>

      {/* Signal Cards */}
      {SIGNAL_CARDS.map((card, idx) => (
        <SignalCard key={card.label} card={card} enterDelay={idx * 120} />
      ))}
    </View>
  );
}

// ── Trust Card Component ───────────────────────────────────────────────────
function TrustCard() {
  return (
    <View style={styles.trustCard}>
      {/* Shield icon */}
      <View style={styles.trustIconBox}>
        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
          <Path
            d="M10 2L2.5 5v5.5C2.5 14.4 5.8 17.2 10 18c4.2-.8 7.5-3.6 7.5-7.5V5L10 2z"
            stroke={BRAND_GREEN_DARK}
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
          <Path
            d="M6.5 10l2.8 2.8L14.5 7"
            stroke={BRAND_GREEN_DARK}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      {/* Text */}
      <View style={styles.trustTextBox}>
        <Text style={styles.trustTitle}>✓ Data never leaves your device</Text>
        <Text style={styles.trustSubtitle}>Private. Local. Secure.</Text>
      </View>
    </View>
  );
}

// ── Logo Mark ──────────────────────────────────────────────────────────────
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

// ── Main Onboarding Screen ─────────────────────────────────────────────────
export default function OnboardingWelcome() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Content animations
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const trustAnim = useRef(new Animated.Value(0)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(160, [
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 600,
        delay: 320,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(trustAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(ctaAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleNext = () => {
    router.push('/onboarding/permissions');
  };

  const handleSkip = () => {
    router.push('/onboarding/permissions');
  };

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <LogoMark />

        {/* Progress pills */}
        <View style={styles.progressPills}>
          <View style={[styles.pillActive, { backgroundColor: BRAND_GREEN }]} />
          <View
            style={[styles.pillInactive, { backgroundColor: PILL_INACTIVE }]}
          />
          <View
            style={[styles.pillInactive, { backgroundColor: PILL_INACTIVE }]}
          />
        </View>

        {/* Skip */}
        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* ── Hero ────────────────────────────────────────────── */}
      <HeroIllustration />

      {/* ── Content ─────────────────────────────────────────── */}
      <View style={styles.contentSection}>
        <Animated.Text
          style={[styles.headline, animStyle(titleAnim)]}
        >
          Financial{' '}
          <Text style={{ color: BRAND_GREEN }}>Clarity</Text>
          {'\n'}Before Financial{'\n'}Problems
        </Animated.Text>

        <Animated.Text
          style={[styles.subtitle, animStyle(subtitleAnim)]}
        >
          SpendLens quietly analyzes activity on your device and highlights
          unusual spending, hidden subscriptions, upcoming risks, and important
          money patterns before they impact you.
        </Animated.Text>
      </View>

      {/* ── Trust Card ──────────────────────────────────────── */}
      <Animated.View
        style={[styles.trustCardWrapper, animStyle(trustAnim)]}
      >
        <TrustCard />
      </Animated.View>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.ctaSection,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
          animStyle(ctaAnim),
        ]}
      >
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.ctaButton,
            {
              transform: [{ scale: pressed ? 0.972 : 1 }],
            },
          ]}
        >
          <Text style={styles.ctaText}>Start Safely</Text>
        </Pressable>
        <Text style={styles.ctaNote}>No bank login required</Text>
      </Animated.View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM_BG,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 8,
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

  // ── Hero ──
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  heroSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.2,
    borderRadius: 70,
  },

  // ── Signal Cards ──
  signalCard: {
    position: 'absolute',
    width: 148,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  signalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalIconEmoji: {
    fontSize: 14,
  },
  signalTextBox: {
    flex: 1,
    minWidth: 0,
  },
  signalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: NEAR_BLACK,
    fontFamily: typography.fontFamily.bold,
    lineHeight: 14,
  },
  signalDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  signalSublabel: {
    fontSize: 10,
    color: MUTED_GRAY,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 14,
    marginTop: 1,
  },

  // ── Content ──
  contentSection: {
    paddingHorizontal: 24,
    marginVertical: 12,
  },
  headline: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 34,
    color: NEAR_BLACK,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 22,
    color: SUBTLE_GRAY,
    marginTop: 12,
    textAlign: 'center',
  },

  // ── Trust Card ──
  trustCardWrapper: {
    paddingHorizontal: 24,
    marginVertical: 12,
    alignItems: 'center',
  },
  trustCard: {
    backgroundColor: 'rgba(246, 250, 243, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(123, 203, 76, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  trustIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextBox: {
    justifyContent: 'center',
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: NEAR_BLACK,
    fontFamily: typography.fontFamily.bold,
    lineHeight: 18,
    textAlign: 'center',
  },
  trustSubtitle: {
    fontSize: 11,
    color: SUBTLE_GRAY,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 16,
    marginTop: 2,
    letterSpacing: 0.25,
    textAlign: 'center',
  },

  // ── CTA ──
  ctaSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginTop: 'auto',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 17,
    borderRadius: 18,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    // Simulated shadow for the gradient CTA feel
    shadowColor: 'rgb(103, 191, 56)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  ctaText: {
    color: 'white',
    fontFamily: typography.fontFamily.semibold,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.1,
  },
  ctaNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#ABABAB',
    fontFamily: typography.fontFamily.regular,
    fontWeight: '400',
    marginTop: 10,
    letterSpacing: 0.1,
  },
});
