import { Redirect } from 'expo-router';
import { useMemo } from 'react';
import { createOnboardingSnapshot, logOnboardingNavigation } from '@/navigation/onboarding-logging';
import { ROUTES } from '@/navigation/routes';
import { useOnboardingStore } from '@/stores/settings-store';

export default function Index() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const isComplete = useOnboardingStore((s) => s.isComplete);
  const isHydrated = useOnboardingStore((s) => s.isHydrated);
  const snapshot = useMemo(
    () => createOnboardingSnapshot({ currentStep, isComplete, isHydrated }),
    [currentStep, isComplete, isHydrated]
  );
  const targetRoute = isComplete ? ROUTES.tabs : ROUTES.onboarding.index;

  logOnboardingNavigation('screen=index', 'redirect', snapshot, targetRoute);

  if (!isComplete) {
    return <Redirect href={ROUTES.onboarding.index} />;
  }

  return <Redirect href={ROUTES.tabs} />;
}
