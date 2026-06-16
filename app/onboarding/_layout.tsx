import React, { useEffect } from 'react';
import { Redirect, useSegments, useRouter } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BackArrowIcon } from '@/components/ui';
import {
  onboardingTransition,
  TransitionStack,
  type TransitionOptions,
} from '@/navigation/transitions';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  createOnboardingSnapshot,
  logOnboardingNavigation,
  logOnboardingRoute,
} from '@/navigation/onboarding-logging';
import { getOnboardingStepIndex } from '@/navigation/onboarding-navigation';
import { ROUTES } from '@/navigation/routes';
import { useOnboardingStore } from '@/stores/settings-store';

export default function OnboardingLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const router = useRouter();
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isComplete = useOnboardingStore((s) => s.isComplete);
  const isHydrated = useOnboardingStore((s) => s.isHydrated);
  const snapshot = createOnboardingSnapshot({ currentStep, isComplete, isHydrated });

  const activeSegment = segments[segments.length - 1];
  const stepIndex = getOnboardingStepIndex(activeSegment);

  const obTheme = theme.onboarding;

  const pill1Width = useSharedValue(stepIndex === 0 ? 24 : 8);
  const pill2Width = useSharedValue(stepIndex === 1 ? 24 : 8);
  const pill3Width = useSharedValue(stepIndex === 2 ? 24 : 8);

  const activeColor1 = obTheme.brandGreen;
  const activeColor23 = obTheme.primary;
  const inactiveColor = obTheme.pillInactive;

  const pill1Color = useSharedValue(stepIndex === 0 ? activeColor1 : inactiveColor);
  const pill2Color = useSharedValue(stepIndex === 1 ? activeColor23 : inactiveColor);
  const pill3Color = useSharedValue(stepIndex === 2 ? activeColor23 : inactiveColor);

  useEffect(() => {
    pill1Width.value = withTiming(stepIndex === 0 ? 24 : 8, { duration: 300 });
    pill2Width.value = withTiming(stepIndex === 1 ? 24 : 8, { duration: 300 });
    pill3Width.value = withTiming(stepIndex === 2 ? 24 : 8, { duration: 300 });

    pill1Color.value = withTiming(stepIndex === 0 ? activeColor1 : inactiveColor, { duration: 300 });
    pill2Color.value = withTiming(stepIndex === 1 ? activeColor23 : inactiveColor, { duration: 300 });
    pill3Color.value = withTiming(stepIndex === 2 ? activeColor23 : inactiveColor, { duration: 300 });
  }, [stepIndex, activeColor1, activeColor23, inactiveColor]);

  const pill1Style = useAnimatedStyle(() => ({
    width: pill1Width.value,
    backgroundColor: pill1Color.value,
  }));

  const pill2Style = useAnimatedStyle(() => ({
    width: pill2Width.value,
    backgroundColor: pill2Color.value,
  }));

  const pill3Style = useAnimatedStyle(() => ({
    width: pill3Width.value,
    backgroundColor: pill3Color.value,
  }));

  const showBackButton = stepIndex > 0;

  useEffect(() => {
    logOnboardingRoute('screen=onboarding-layout', 'mount', snapshot, {
      segments,
    });
    return () => {
      logOnboardingRoute('screen=onboarding-layout', 'unmount', snapshot);
    };
  }, []);

  useEffect(() => {
    logOnboardingRoute('screen=onboarding-layout', 'active', snapshot, {
      activeSegment: String(activeSegment),
      stepIndex,
    });
  }, [activeSegment, stepIndex, snapshot]);

  const onboardingStackOptions: TransitionOptions = {
    headerShown: false,
    animation: 'none',
    contentStyle: { backgroundColor: 'transparent' },
    ...onboardingTransition,
  };

  if (isHydrated && isComplete) {
    logOnboardingNavigation('screen=onboarding-layout', 'redirect', snapshot, ROUTES.tabs);
    return <Redirect href={ROUTES.tabs} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: obTheme.background, paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* ── Shared Top Bar (Static) ─────────────────────────── */}
      <View style={styles.topBar}>
        <View style={[styles.topBarSide, { alignItems: 'flex-start' }]}>
          {showBackButton && (
            <Pressable
              onPress={() => {
                logOnboardingNavigation('screen=onboarding-layout', 'back', snapshot);
                router.back();
              }}
              style={({ pressed }) => [
                styles.backButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]}
            >
              <BackArrowIcon color={obTheme.primary} size={20} />
            </Pressable>
          )}
        </View>

        {/* Centered Progress pills */}
        <View style={styles.topBarCenter}>
          <Animated.View style={[styles.pill, pill1Style]} />
          <Animated.View style={[styles.pill, pill2Style]} />
          <Animated.View style={[styles.pill, pill3Style]} />
        </View>

        {/* Right logo icon */}
        <View style={[styles.topBarSide, { alignItems: 'flex-end' }]}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.headerLogo}
          />
        </View>
      </View>

      <TransitionStack
        screenOptions={onboardingStackOptions as any}
      >
        <TransitionStack.Screen name="index" />
        <TransitionStack.Screen name="permissions" />
        <TransitionStack.Screen name="balance" />
      </TransitionStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  topBarSide: {
    width: 44,
    height: 36,
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pill: {
    height: 4,
    borderRadius: 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerLogo: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
});

