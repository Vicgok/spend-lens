import type { Href, Router } from 'expo-router';
import { ROUTES } from './routes';

const ONBOARDING_SEGMENTS = ['index', 'permissions', 'balance'] as const;

export type OnboardingSegment = (typeof ONBOARDING_SEGMENTS)[number];

const ONBOARDING_ROUTE_BY_SEGMENT: Record<OnboardingSegment, Href> = {
  index: ROUTES.onboarding.index,
  permissions: ROUTES.onboarding.permissions,
  balance: ROUTES.onboarding.balance,
};

export function getOnboardingStepIndex(segment?: string): number {
  const normalizedSegment = (segment ?? 'index') as OnboardingSegment;
  const stepIndex = ONBOARDING_SEGMENTS.indexOf(normalizedSegment);

  return stepIndex === -1 ? 0 : stepIndex;
}

export function getOnboardingRoute(segment: OnboardingSegment): Href {
  return ONBOARDING_ROUTE_BY_SEGMENT[segment];
}

export function getNextOnboardingRoute(segment?: string): Href {
  const stepIndex = getOnboardingStepIndex(segment);
  const nextStep = ONBOARDING_SEGMENTS[Math.min(stepIndex + 1, ONBOARDING_SEGMENTS.length - 1)];

  return getOnboardingRoute(nextStep);
}

export function goToNextOnboardingStep(router: Router, segment?: string) {
  router.push(getNextOnboardingRoute(segment));
}
