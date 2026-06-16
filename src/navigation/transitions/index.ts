import { Stack } from 'expo-router';
import { withScreenTransitions } from 'react-native-screen-transitions';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { NativeStackAdapterOptions } from 'react-native-screen-transitions';
import { createElement } from 'react';
import type { ComponentProps } from 'react';

export { detailTransition } from './detailTransition';
export { modalTransition } from './modalTransition';
export { onboardingTransition } from './onboardingTransition';

export type TransitionOptions = NativeStackAdapterOptions<NativeStackNavigationOptions>;

const ExpoRouterStackNavigator = {
  Navigator: Stack,
  Screen: Stack.Screen,
  Protected: Stack.Protected,
};

const WrappedStack = withScreenTransitions(ExpoRouterStackNavigator as any);

type TransitionStackProps = ComponentProps<typeof Stack>;

// Preserve Expo Router's <Stack /> API while routing rendering through the
// transition adapter, which expects a navigator object with `.Navigator`.
function TransitionStackComponent(props: TransitionStackProps) {
  return createElement(WrappedStack.Navigator, props);
}

TransitionStackComponent.Screen = WrappedStack.Screen;
TransitionStackComponent.Protected = WrappedStack.Protected;

export const TransitionStack = TransitionStackComponent as typeof Stack;
