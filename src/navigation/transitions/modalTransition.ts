import { interpolate } from 'react-native-reanimated';
import ScreenTransitions from 'react-native-screen-transitions';
import type { TransitionOptions } from './index';

const { Specs } = ScreenTransitions;

export const modalTransition: TransitionOptions = {
  enableTransitions: true,
  gestureEnabled: true,
  gestureDirection: 'vertical',
  backdropBehavior: 'dismiss',
  transitionSpec: {
    open: Specs.DefaultSpec,
    close: Specs.DefaultSpec,
  },
  screenStyleInterpolator: ({
    progress,
    layouts: {
      screen: { height },
    },
  }) => {
    'worklet';

    const translateY = interpolate(progress, [0, 1, 2], [height, 0, -height]);
    const backdropOpacity = interpolate(progress, [0, 1, 2], [0, 1, 0]);

    return {
      backdrop: {
        style: {
          backgroundColor: 'rgba(15, 12, 10, 0.45)',
          opacity: backdropOpacity,
        },
      },
      content: {
        style: {
          transform: [{ translateY }],
        },
      },
    };
  },
};
