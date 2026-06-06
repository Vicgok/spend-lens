import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { typography, spacing } from '@/theme';

export default function OnboardingWelcome() {
  const { theme } = useTheme();

  const handleNext = () => {
    router.push('/onboarding/permissions');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <View style={styles.branding}>
          <Text style={[styles.observatoryText, { color: theme.textSecondary }]}>
            FINANCIAL OBSERVATORY
          </Text>
        </View>

        <Text style={[styles.headline, { color: theme.text, fontFamily: typography.fontFamily.bold }]}>
          Manage Your Money{"\n"}Clearly
        </Text>

        <Text style={[styles.subtext, { color: theme.textSecondary }]}>
          Automatically track transactions, detect money leaks, and understand your spending patterns.
        </Text>

        {/* Editorial Grid (Decorative swiss layout - centered) */}
        <View style={[styles.editorialGrid, { borderColor: theme.border }]}>
          <View style={styles.gridRow}>
            <View style={[styles.gridCell, styles.limeFill, { borderColor: theme.border, backgroundColor: theme.primary }]}>
              <Text style={[styles.gridTextLabel, { color: '#1B1B1B', fontFamily: typography.fontFamily.bold }]}>
                SPENDLENS
              </Text>
            </View>
            <View style={[styles.gridCell, { borderColor: theme.border }]}>
              <Text style={[styles.gridText, { color: theme.textSecondary }]}>
                SMS Tracker ➔
              </Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.gridCell, { borderColor: theme.border, flex: 1.3 }]}>
              <Text style={[styles.gridTextMono, { color: theme.text, fontFamily: typography.fontFamily.mono }]}>
                ₹ PROJECTED: 94.2% ACC
              </Text>
            </View>
            <View style={[styles.gridCell, { borderColor: theme.border }]}>
              <Text style={[styles.gridText, { color: theme.expense, fontFamily: typography.fontFamily.bold }]}>
                LEAK DETECTED ⚠
              </Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.gridCell, { borderColor: theme.border }]}>
              <Text style={[styles.gridText, { color: theme.textSecondary }]}>
                [ 100% Local ]
              </Text>
            </View>
            <View style={[styles.gridCell, { borderColor: theme.border, flex: 1.5 }]}>
              <Text style={[styles.gridText, { color: theme.income, fontFamily: typography.fontFamily.bold }]}>
                SAVINGS RATE: +32%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Get Started CTA */}
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.ctaButton,
            {
              backgroundColor: theme.text,
              borderColor: theme.border,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={[styles.ctaText, { color: theme.background, fontFamily: typography.fontFamily.bold }]}>
            Get Started
          </Text>
        </Pressable>

        {/* Privacy First Note */}
        <View style={styles.privacyNote}>
          <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
            🔒 Privacy First Guarantee
          </Text>
          <Text style={[styles.privacySubText, { color: theme.textMuted }]}>
            All sms scans and financial calculations run locally. Your data never leaves your phone.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  editorialGrid: {
    marginTop: 32,
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    height: 48,
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  limeFill: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  gridTextLabel: {
    fontSize: 12,
    letterSpacing: 2,
  },
  gridText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  gridTextMono: {
    fontSize: 10,
  },
  mainContent: {
    marginTop: 40,
    flex: 1,
    justifyContent: 'center',
  },
  branding: {
    marginBottom: 12,
  },
  observatoryText: {
    fontSize: 11,
    letterSpacing: 2,
  },
  headline: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    lineHeight: 22,
  },
  bottomSection: {
    marginBottom: 60,
    gap: 20,
  },
  ctaButton: {
    height: 56,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  privacyNote: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: 13,
    marginBottom: 4,
  },
  privacySubText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
});
