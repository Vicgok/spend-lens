import { interpolate } from 'react-native-reanimated';
import ScreenTransitions from 'react-native-screen-transitions';
import type { TransitionOptions } from './index';

const { Specs } = ScreenTransitions;

export const onboardingTransition: TransitionOptions = {
  enableTransitions: true,
  gestureEnabled: false,
  experimental_animateOnInitialMount: true,
  transitionSpec: {
    open: {
      ...Specs.DefaultSpec,
      overshootClamping: true,
    },
    close: {
      ...Specs.DefaultSpec,
      overshootClamping: true,
    },
  },
  screenStyleInterpolator: ({
    progress,
    layouts: {
      screen: { width },
    },
  }) => {
    'worklet';

    const translateX = interpolate(progress, [0, 1, 2], [width, 0, -width]);

    return {
      content: {
        style: {
          transform: [{ translateX }],
        },
      },
    };
  },
};
