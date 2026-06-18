import React, { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { enableScreens } from 'react-native-screens';
import {
  ThemeProvider as NavigationProvider,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { logger } from '@/lib/logger';
import { tokens } from '@/theme';
import {
  TransitionStack,
  detailTransition,
  modalTransition,
  onboardingTransition,
  type TransitionOptions,
} from '@/navigation/transitions';
import { ThemeProvider, useTheme } from '@/providers/theme-provider';
import { useOnboardingStore, useSettingsStore } from '@/stores/settings-store';
export { ErrorBoundary } from './error';

// Optimize native screens behavior
enableScreens(true);

SplashScreen.preventAutoHideAsync();

function getRouteBackground(pathname: string, fallbackBackground: string, onboardingBackground: string) {
  if (pathname.startsWith('/onboarding')) {
    return onboardingBackground;
  }

  if (
    pathname.startsWith('/categories')
  ) {
    return '#E1D7C2';
  }

  if (
    pathname.includes('/insights')
  ) {
    return tokens.colors.background;
  }

  if (
    pathname === '/' ||
    pathname === '/(tabs)' ||
    pathname.startsWith('/transactions') ||
    pathname.startsWith('/add-transaction') ||
    pathname.startsWith('/transaction/')
  ) {
    return tokens.colors.tactileBackground;
  }

  return fallbackBackground;
}

function RootNavigator() {
  const { theme, isDark } = useTheme();
  const pathname = usePathname();
  const routeBackground = getRouteBackground(
    pathname,
    theme.background,
    theme.onboarding.background
  );

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(routeBackground).catch((err) => {
      logger.warn('Failed to set system UI background color', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, [routeBackground]);

  useEffect(() => {
    async function configureAndroidNavbar() {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
          await NavigationBar.setVisibilityAsync('visible');
        } catch (error) {
          logger.warn('Failed to configure navigation bar', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    configureAndroidNavbar();
  }, [isDark]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: routeBackground,
      card: routeBackground,
      text: theme.text,
      border: theme.border,
    },
  };

  const onboardingScreenOptions: TransitionOptions = {
    ...onboardingTransition,
    contentStyle: { backgroundColor: theme.onboarding.background },
  };

  const tabScreenOptions: TransitionOptions = {
    ...detailTransition,
    contentStyle: { backgroundColor: 'transparent' },
  };

  const categoriesScreenOptions: TransitionOptions = {
    ...detailTransition,
    contentStyle: { backgroundColor: '#E1D7C2' },
  };

  const transactionDetailScreenOptions: TransitionOptions = {
    ...detailTransition,
    contentStyle: { backgroundColor: '#F6F3EC' },
  };

  return (
    <NavigationProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: routeBackground }}>
        <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
        <TransitionStack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: routeBackground },
            animation: 'none',
          }}
        >
          <TransitionStack.Screen name="index" />
          <TransitionStack.Screen
            name="onboarding"
            options={onboardingScreenOptions as any}
          />
          <TransitionStack.Screen
            name="(tabs)"
            options={tabScreenOptions as any}
          />
          <TransitionStack.Screen
            name="add-transaction"
            options={modalTransition as any}
          />
          <TransitionStack.Screen
            name="categories"
            options={categoriesScreenOptions as any}
          />
          <TransitionStack.Screen
            name="transaction/[id]"
            options={transactionDetailScreenOptions as any}
          />
        </TransitionStack>
      </View>
    </NavigationProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
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
        logger.warn('Failed to load stores', {
          error: e instanceof Error ? e.message : String(e),
        });
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
