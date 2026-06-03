import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import { enableScreens } from 'react-native-screens';
import {
  ThemeProvider as NavigationProvider,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { ThemeProvider, useTheme } from '@/providers/theme-provider';
import { useOnboardingStore, useSettingsStore } from '@/stores/settings-store';

// Optimize native screens behavior
enableScreens(true);

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { theme, isDark } = useTheme();

  useEffect(() => {
    async function configureAndroidNavbar() {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
        } catch (error) {
          console.warn('Failed to configure navigation bar:', error);
        }
      }
    }
    configureAndroidNavbar();
  }, [isDark]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <NavigationProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
            animation: 'ios_from_right',
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen
            name="add-transaction"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
          <Stack.Screen name="categories" />
          <Stack.Screen name="accounts" />
        </Stack>
      </View>
    </NavigationProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
    'JetBrainsMono-Bold': JetBrainsMono_700Bold,
  });

  const [isStoreLoaded, setIsStoreLoaded] = React.useState(false);

  const checkOnboarding = useOnboardingStore((s) => s.checkOnboardingStatus);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([
          checkOnboarding(),
          loadSettings(),
        ]);
      } catch (e) {
        console.warn('Failed to load stores:', e);
      } finally {
        setIsStoreLoaded(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isStoreLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isStoreLoaded]);

  if ((!fontsLoaded && !fontError) || !isStoreLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
