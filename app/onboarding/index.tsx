import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import { typography } from '@/theme';
import { useIsFocused } from '@react-navigation/native';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Line,
} from 'react-native-svg';
import {
  CalendarIcon,
  RefreshIcon,
  ShieldIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  GraphUpIcon,
} from '@/components/ui/OnboardingIcons';
import { OnboardingTransition } from '@/components/ui/OnboardingTransition';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 300;

const DOT_AMBER = '#F59E0B';
const DOT_GRAY = '#9CA3AF';

// Helper to convert hex to rgba dynamically
function hexToRgba(hex: string, alpha: number): string {
  if (!hex || hex.length < 7) return 'rgba(0,0,0,0)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Signal Card Data ───────────────────────────────────────────────────────
type SignalCardData = {
  icon: string;
  label: string;
  sublabel: string;
  dotColor: string;
  accent?: boolean;
  position: { top?: number; bottom?: number; left?: number; right?: number };
};

const SIGNAL_CARDS: SignalCardData[] = [
  {
    icon: 'calendar',
    label: 'Bill Due',
    sublabel: 'Electricity · 3 days',
    dotColor: DOT_AMBER,
    position: { top: 10, left: 16 },
  },
  {
    icon: 'refresh',
    label: 'Subscription',
    sublabel: 'Netflix · ₹199',
    dotColor: DOT_GRAY,
    position: { top: 22, right: 16 },
  },
  {
    icon: 'shield',
    label: 'Protected',
    sublabel: 'Activity normal',
    dotColor: 'brandGreen',
    accent: true,
    position: { top: 120, left: 12 },
  },
  {
    icon: 'arrow-up',
    label: 'Salary In',
    sublabel: '+₹3,200 received',
    dotColor: 'brandGreen',
    accent: true,
    position: { top: 124, right: 12 },
  },
  {
    icon: 'check-circle',
    label: 'All Clear',
    sublabel: 'No anomalies found',
    dotColor: 'brandGreen',
    position: { bottom: 20, left: 16 },
  },
  {
    icon: 'graph-up',
    label: 'Spending Up',
    sublabel: '18% vs last week',
    dotColor: DOT_AMBER,
    position: { bottom: 16, right: 16 },
  },
];

// Helper to render custom SVG icons based on name
const renderSignalIcon = (name: string, color: string) => {
  switch (name) {
    case 'calendar': return <CalendarIcon color={color} size={15} />;
    case 'refresh': return <RefreshIcon color={color} size={15} />;
    case 'shield': return <ShieldIcon color={color} size={15} />;
    case 'arrow-up': return <ArrowUpIcon color={color} size={15} />;
    case 'check-circle': return <CheckCircleIcon color={color} size={15} />;
    case 'graph-up': return <GraphUpIcon color={color} size={15} />;
    default: return null;
  }
};

// ── Floating Signal Card Component (Staticized) ─────────────────────────────
const SignalCard = React.memo(({ card }: { card: SignalCardData }) => {
  const { theme } = useTheme();
  const obTheme = theme.onboarding;

  const cardBg = card.accent
    ? obTheme.accentCardBg
    : 'rgba(255, 255, 255, 0.92)';
  const cardBorder = card.accent
    ? hexToRgba(obTheme.accentCardBg, 0.4)
    : 'rgba(116, 81, 67, 0.2)';
  const iconBg = card.accent ? obTheme.accentCardIconBg : 'rgba(116, 81, 67, 0.08)';
  const dotColorResolved = card.dotColor === 'brandGreen' ? obTheme.brandGreen : card.dotColor;
  const contentColor = card.accent ? obTheme.accentCardTitle : obTheme.primary;
  const sublabelColor = card.accent ? obTheme.accentCardSubtitle : obTheme.primary;

  return (
    <View
      style={[
        styles.signalCard,
        card.position,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.signalIconBox, { backgroundColor: iconBg }]}>
        {renderSignalIcon(card.icon, contentColor)}
      </View>

      {/* Text */}
      <View style={styles.signalTextBox}>
        <View style={styles.signalLabelRow}>
          <Text style={[styles.signalLabel, { color: contentColor }]}>
            {card.label}
          </Text>
          <View
            style={[styles.signalDot, { backgroundColor: card.accent ? obTheme.accentCardDot : dotColorResolved }]}
          />
        </View>
        <Text style={[styles.signalSublabel, { color: sublabelColor }]} numberOfLines={1}>
          {card.sublabel}
        </Text>
      </View>
    </View>
  );
});

// ── Hero Illustration with Walking Figure (Staticized) ──────────────────────
const HeroIllustration = React.memo(() => {
  const { theme } = useTheme();
  const obTheme = theme.onboarding;

  const svgWidth = SCREEN_WIDTH;
  const svgHeight = HERO_HEIGHT;
  const scale = svgWidth / 390;
  const centerX = 195;
  const centerY = 172;

  return (
    <View style={styles.heroContainer}>
      {/* Subtle pulse ring (static background design element) */}
      <View
        style={[
          styles.pulseRing,
          {
            top: centerY * scale - 70,
            left: centerX * scale - 70,
            width: 140,
            height: 140,
            borderColor: obTheme.brandGreen,
            opacity: 0.12,
            transform: [{ scale: 1.0 }],
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
        {/* Dot texture grid */}
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => (
            <Circle
              key={`dot-${row}-${col}`}
              cx={col * 36 + 18}
              cy={row * 42 + 21}
              r={1}
              fill={obTheme.brandGreen}
              opacity={0.18}
            />
          ))
        )}

        {/* Connector lines to card positions */}
        <Line x1={174} y1={152} x2={166} y2={138} stroke={obTheme.brandGreen} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={216} y1={152} x2={224} y2={138} stroke={obTheme.brandGreen} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={172} y1={170} x2={162} y2={168} stroke={obTheme.brandGreen} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={218} y1={170} x2={228} y2={168} stroke={obTheme.brandGreen} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={182} y1={218} x2={169} y2={240} stroke={obTheme.brandGreen} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />
        <Line x1={208} y1={218} x2={221} y2={240} stroke={obTheme.brandGreen} strokeWidth={0.7} strokeDasharray="2 5" opacity={0.2} />

        {/* Cute Cartoon Mascot Figure (Monochrome) */}
        <Ellipse cx={195} cy={278} rx={22} ry={5} fill="rgba(0,0,0,0.06)" />
        <Circle cx={195} cy={165} r={36} fill={hexToRgba(obTheme.brandGreen, 0.06)} />

        <Path
          d="M 175 190 C 160 210, 160 245, 175 260 C 185 270, 205 270, 215 260 C 230 245, 230 210, 215 190 Z"
          fill="#FAF9F7"
          stroke={obTheme.primary}
          strokeWidth={1.8}
        />
        <Ellipse cx={195} cy={230} rx={16} ry={22} fill={hexToRgba(obTheme.brandGreen, 0.15)} />

        <Circle cx={195} cy={160} r={28} fill="#FAF9F7" stroke={obTheme.primary} strokeWidth={1.8} />

        {/* face blush and details */}
        <Circle cx={178} cy={164} r={3.5} fill={obTheme.brandGreen} opacity={0.4} />
        <Circle cx={212} cy={164} r={3.5} fill={obTheme.brandGreen} opacity={0.4} />
        <Circle cx={183} cy={157} r={4.5} fill={obTheme.primary} />
        <Circle cx={207} cy={157} r={4.5} fill={obTheme.primary} />
        <Circle cx={181.5} cy={155.5} r={1.5} fill="white" />
        <Circle cx={205.5} cy={155.5} r={1.5} fill="white" />
        <Path d="M 191 166 Q 195 171 199 166" stroke={obTheme.primary} strokeWidth={1.8} strokeLinecap="round" fill="none" />

        <Path d="M 195 132 L 195 122" stroke={obTheme.primary} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={195} cy={119} r={4.5} fill={obTheme.brandGreen} stroke={obTheme.primary} strokeWidth={1.5} />

        <Path
          d="M 168 205 C 152 200, 142 190, 138 177"
          stroke={obTheme.primary}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={138} cy={177} r={3} fill={obTheme.brandGreen} stroke={obTheme.primary} strokeWidth={1.5} />

        <Path
          d="M 222 205 C 235 210, 245 215, 252 227"
          stroke={obTheme.primary}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={252} cy={227} r={3} fill={obTheme.brandGreen} stroke={obTheme.primary} strokeWidth={1.5} />

        <Path d="M 182 262 L 180 278" stroke={obTheme.primary} strokeWidth={4.5} strokeLinecap="round" />
        <Path d="M 174 278 L 183 278" stroke={obTheme.primary} strokeWidth={4} strokeLinecap="round" />

        <Path d="M 208 262 L 210 278" stroke={obTheme.primary} strokeWidth={4.5} strokeLinecap="round" />
        <Path d="M 207 278 L 216 278" stroke={obTheme.primary} strokeWidth={4} strokeLinecap="round" />

        <Circle cx={152} cy={80} r={3} fill={obTheme.brandGreen} opacity={0.42} />
        <Circle cx={138} cy={108} r={1.8} fill={obTheme.brandGreen} opacity={0.28} />
        <Circle cx={148} cy={244} r={2.2} fill={obTheme.brandGreen} opacity={0.32} />
        <Circle cx={244} cy={86} r={2.5} fill={obTheme.brandGreen} opacity={0.38} />
        <Circle cx={258} cy={112} r={1.6} fill={obTheme.brandGreen} opacity={0.25} />
        <Circle cx={248} cy={252} r={2.8} fill={obTheme.brandGreen} opacity={0.35} />
        <Circle cx={195} cy={72} r={3.5} fill={obTheme.brandGreen} opacity={0.25} />

        <Path d="M 144 68 L 148 64 L 144 60" stroke={obTheme.brandGreen} strokeWidth={1.1} strokeLinecap="round" opacity={0.38} />
        <Path d="M 148 64 L 153 64" stroke={obTheme.brandGreen} strokeWidth={1.1} strokeLinecap="round" opacity={0.38} />

        <Path d="M 246 62 L 250 58 L 246 54" stroke={obTheme.brandGreen} strokeWidth={1.1} strokeLinecap="round" opacity={0.32} />
        <Path d="M 250 58 L 255 58" stroke={obTheme.brandGreen} strokeWidth={1.1} strokeLinecap="round" opacity={0.32} />
      </Svg>

      {/* Signal Cards */}
      {SIGNAL_CARDS.map((card) => (
        <SignalCard key={card.label} card={card} />
      ))}
    </View>
  );
});

// ── Trust Card Component ───────────────────────────────────────────────────
const TrustCard = React.memo(() => {
  const { theme } = useTheme();
  const obTheme = theme.onboarding;

  return (
    <View style={[styles.trustCard, { borderColor: hexToRgba(obTheme.primary, 0.2) }]}>
      {/* Shield icon */}
      <View style={[styles.trustIconBox, { backgroundColor: hexToRgba(obTheme.primary, 0.08), borderColor: hexToRgba(obTheme.primary, 0.15) }]}>
        <ShieldIcon color={obTheme.brandGreen} size={20} />
      </View>

      {/* Text */}
      <View style={styles.trustTextBox}>
        <Text style={[styles.trustTitle, { color: obTheme.primary }]}>✓ Data never leaves your device</Text>
        <Text style={[styles.trustSubtitle, { color: obTheme.primary }]}>Private. Local. Secure.</Text>
      </View>
    </View>
  );
});

// ── Logo Mark ──────────────────────────────────────────────────────────────
const LogoMark = React.memo(() => {
  const { theme } = useTheme();
  const obTheme = theme.onboarding;

  return (
    <View style={styles.logoRow}>
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: 34, height: 34, borderRadius: 9 }}
      />
      <Text style={[styles.logoText, { color: obTheme.primary }]}>SpendLens</Text>
    </View>
  );
});

// ── Main Onboarding Welcome Screen ─────────────────────────────────────────
export default function OnboardingWelcome() {
  const { theme } = useTheme();
  const obTheme = theme.onboarding;
  const insets = useSafeAreaInsets();

  const isFocused = useIsFocused();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setIsExiting(false);
    }
  }, [isFocused]);

  const handleNext = () => {
    setIsExiting(true);
  };

  const handleExitComplete = () => {
    router.push('/onboarding/permissions');
  };

  return (
    <View style={[styles.container, { backgroundColor: obTheme.background, paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      {/* ── Top Bar (Static) ─────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topBarSide} />

        {/* Progress pills */}
        <View style={styles.topBarCenter}>
          <View style={[styles.pillActive, { backgroundColor: obTheme.brandGreen }]} />
          <View style={[styles.pillInactive, { backgroundColor: obTheme.pillInactive }]} />
          <View style={[styles.pillInactive, { backgroundColor: obTheme.pillInactive }]} />
        </View>

        <View style={[styles.topBarSide, { alignItems: 'flex-end' }]}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.headerLogo}
          />
        </View>
      </View>

      {/* Content wrapper with unified Transition animation */}
      <OnboardingTransition exit={isExiting} onExitComplete={handleExitComplete} style={{ flex: 1 }}>
        {/* ── Middle Centered Section ────────────────────────── */}
        <View style={styles.middleContainer}>
          {/* ── Hero ────────────────────────────────────────────── */}
          <HeroIllustration />

          {/* ── Content ─────────────────────────────────────────── */}
          <View style={styles.contentSection}>
            <Text style={[styles.headline, { color: obTheme.primary }]}>
              Financial{' '}
              <Text style={{ color: obTheme.brandGreen }}>Clarity</Text>
              {'\n'}Before Financial{'\n'}Problems
            </Text>

            <Text style={[styles.subtitle, { color: obTheme.primary }]}>
              SpendLens quietly analyzes activity on your device and highlights
              unusual spending, hidden subscriptions, upcoming risks, and important
              money patterns before they impact you.
            </Text>
          </View>

          {/* ── Trust Card ──────────────────────────────────────── */}
          <View style={styles.trustCardWrapper}>
            <TrustCard />
          </View>
        </View>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <View
          style={[
            styles.ctaSection,
            { paddingBottom: Math.max(insets.bottom, 20) + 24 },
          ]}
        >
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.ctaButton,
              {
                backgroundColor: obTheme.primary,
                shadowColor: obTheme.primary,
                transform: [{ scale: pressed ? 0.972 : 1 }],
              },
            ]}
          >
            <Text style={[styles.ctaText, { color: obTheme.accentCardTitle }]}>Save Me From Myself</Text>
          </Pressable>
          <Text style={[styles.ctaNote, { color: obTheme.mutedText }]}>No bank login required</Text>
        </View>
      </OnboardingTransition>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  middleContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  topBarSide: {
    width: 44,
    alignItems: 'center',
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
  headerLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
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
    letterSpacing: -0.5,
    textAlign: 'left',
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'left',
  },

  // ── Trust Card ──
  trustCardWrapper: {
    paddingHorizontal: 24,
    marginVertical: 12,
    alignItems: 'center',
  },
  trustCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    width: '100%',
  },
  trustIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextBox: {
    justifyContent: 'center',
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: typography.fontFamily.bold,
    lineHeight: 18,
    textAlign: 'left',
  },
  trustSubtitle: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 16,
    marginTop: 2,
    letterSpacing: 0.25,
    textAlign: 'left',
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaText: {
    fontFamily: typography.fontFamily.semibold,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.1,
  },
  ctaNote: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    fontWeight: '400',
    marginTop: 10,
    letterSpacing: 0.1,
  },
});
