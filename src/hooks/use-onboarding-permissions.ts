import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { type Href, router } from 'expo-router';
import {
  checkSMSPermission,
  requestSMSPermission,
} from '@/features/sms-parser/sms-reader';
import SpendLensSmsModule from '../../modules/spendlens-sms-module';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/navigation/routes';

type CustomAlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type CustomAlertConfig = {
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
  iconType?: 'info' | 'success' | 'warning' | 'shield';
};

type UseOnboardingPermissionsOptions = {
  logNavigation: (action: 'push' | 'replace' | 'back', target?: Href) => void;
};

export function useOnboardingPermissions({
  logNavigation,
}: UseOnboardingPermissionsOptions) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [customAlert, setCustomAlert] = useState<CustomAlertConfig | null>(null);

  useEffect(() => {
    async function verifyPermission() {
      if (Platform.OS === 'android') {
        const result = await checkSMSPermission();
        setHasPermission(result);
      }
      setIsChecking(false);
    }

    verifyPermission();
  }, []);

  const showCustomAlert = useCallback(
    (
      title: string,
      message: string,
      buttons?: CustomAlertButton[],
      iconType?: 'info' | 'success' | 'warning' | 'shield'
    ) => {
      setCustomAlert({ title, message, buttons, iconType });
    },
    []
  );

  const dismissAlert = useCallback(() => {
    setCustomAlert(null);
  }, []);

  const navigateToBalance = useCallback(() => {
    logNavigation('push', ROUTES.onboarding.balance);
    router.push(ROUTES.onboarding.balance);
  }, [logNavigation]);

  const handleRequestPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      showCustomAlert(
        'SMS Reader',
        'Automatic SMS reading is only available on Android due to iOS platform restrictions. You can track expenses manually using the Add Transaction screen.',
        undefined,
        'info'
      );
      return;
    }

    if (!SpendLensSmsModule) {
      showCustomAlert(
        'Expo Go Limitation',
        'SMS tracking requires custom native permissions which are not available in the generic Expo Go app. Build a standalone APK to enable real SMS tracking.',
        [
          { text: 'Continue', onPress: navigateToBalance },
          { text: 'Cancel', style: 'cancel' },
        ],
        'shield'
      );
      return;
    }

    try {
      const granted = await requestSMSPermission();
      setHasPermission(granted);

      if (granted) {
        showCustomAlert(
          'Permission Granted!',
          'SpendLens will now automatically scan financial messages when they arrive.',
          [{ text: 'Continue', onPress: navigateToBalance }],
          'success'
        );
        return;
      }

      showCustomAlert(
        'Permission Denied',
        'You can still add transactions manually. You can enable SMS tracking anytime in Settings.',
        undefined,
        'warning'
      );
    } catch (error) {
      logger.error('Failed to request SMS permission', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [navigateToBalance, showCustomAlert]);

  return {
    customAlert,
    dismissAlert,
    handleRequestPermission,
    hasPermission,
    isChecking,
    navigateToBalance,
  };
}
