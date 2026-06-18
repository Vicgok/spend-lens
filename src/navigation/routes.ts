import type { Href } from 'expo-router';

export const ROUTES = {
  root: '/' as Href,
  tabs: '/(tabs)' as Href,
  tabsSettings: '/(tabs)/settings' as Href,
  tabsAccounts: '/(tabs)/accounts' as Href,
  addTransaction: '/add-transaction' as Href,
  categories: '/categories' as Href,
  accounts: '/accounts' as Href,
  onboarding: {
    index: '/onboarding' as Href,
    permissions: '/onboarding/permissions' as Href,
    balance: '/onboarding/balance' as Href,
  },
} as const;

export function getAccountDetailRoute(accountId: string): Href {
  return `/accounts/${accountId}` as Href;
}
