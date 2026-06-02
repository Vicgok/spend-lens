import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { typography } from '@/theme';
import { spacing, borderRadius } from '@/theme';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  title: string;
  subtitle: string;
  emoji: string;
}

const slides: OnboardingSlide[] = [
  {
    emoji: '💸',
    title: 'Track Every Rupee',
    subtitle:
      'Automatically read transactions from your SMS messages. No manual entry needed on Android.',
  },
  {
    emoji: '🏷️',
    title: 'Smart Categories',
    subtitle:
      'AI-powered categorization sorts your spending into Food, Transport, Shopping, and more — instantly.',
  },
  {
    emoji: '📊',
    title: 'Know Your Spending',
    subtitle:
      'Beautiful charts and insights show exactly where your money goes each month.',
  },
  {
    emoji: '🎯',
    title: 'Save Smarter',
    subtitle:
      'Set savings goals and get personalized tips on how to reduce spending and reach them faster.',
  },
];

export default function OnboardingWelcome() {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      router.push('/onboarding/permissions');
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/permissions');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Skip button */}
      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
      </Pressable>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {slide.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Page indicators */}
        <View style={styles.indicators}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === activeIndex ? theme.primary : theme.border,
                  width: index === activeIndex ? 28 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <Pressable onPress={handleNext} style={styles.ctaWrapper}>
          <LinearGradient
            colors={theme.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>
              {activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Brand */}
        <Text style={[styles.brandText, { color: theme.textMuted }]}>
          {APP_NAME} · {APP_TAGLINE}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 56,
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
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  ctaWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  ctaButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
    color: '#FFFFFF',
  },
  brandText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
  },
});
