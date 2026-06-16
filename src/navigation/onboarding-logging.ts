import { type Href } from 'expo-router';
import { logger } from '@/lib/logger';

export type OnboardingSnapshot = {
  currentStep: number;
  isComplete: boolean;
  isHydrated: boolean;
};

export function createOnboardingSnapshot(state: OnboardingSnapshot): OnboardingSnapshot {
  return {
    currentStep: state.currentStep,
    isComplete: state.isComplete,
    isHydrated: state.isHydrated,
  };
}

export function logOnboardingRoute(
  screen: string,
  event: string,
  snapshot: OnboardingSnapshot,
  extra?: Record<string, unknown>
) {
  logger.debug(`[ROUTE_TRACE] ${screen} ${event}`, {
    ...snapshot,
    ...extra,
  });
}

export function logOnboardingNavigation(
  screen: string,
  action: 'push' | 'replace' | 'back' | 'redirect',
  snapshot: OnboardingSnapshot,
  target?: Href
) {
  logger.debug(`[NAV_TRACE] ${screen}`, {
    action,
    target,
    ...snapshot,
  });
}
