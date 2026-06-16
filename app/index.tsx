import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useOnboardingStore } from '@/stores/settings-store';

export default function Index() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isComplete = useOnboardingStore((s) => s.isComplete);
  const isHydrated = useOnboardingStore((s) => s.isHydrated);

  useEffect(() => {
    console.log(
      `[ROUTE_TRACE] mount screen=index route=/ state=${JSON.stringify({
        currentStep,
        isComplete,
        isHydrated,
      })}`
    );
    return () => {
      console.log('[ROUTE_TRACE] unmount screen=index route=/');
    };
  }, []);

  console.log(
    `[NAV_TRACE] screen=index action=redirect target=${isComplete ? '/(tabs)' : '/onboarding'} state=${JSON.stringify({
      currentStep,
      isComplete,
      isHydrated,
    })}`
  );

  if (!isComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
