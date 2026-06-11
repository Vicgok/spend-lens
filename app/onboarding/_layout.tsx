import { Stack } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';

export default function OnboardingLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.onboarding.background },
        animation: 'none',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="balance" />
    </Stack>
  );
}
