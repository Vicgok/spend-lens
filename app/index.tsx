
import { Redirect } from 'expo-router';
import { useOnboardingStore } from '@/stores/settings-store';

export default function Index() {
  const isOnboardingComplete = useOnboardingStore((s) => s.isComplete);

  if (!isOnboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
