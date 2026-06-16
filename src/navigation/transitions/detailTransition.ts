import { interpolate } from 'react-native-reanimated';
import ScreenTransitions from 'react-native-screen-transitions';
import type { TransitionOptions } from './index';

const { Specs } = ScreenTransitions;

export const detailTransition: TransitionOptions = {
  enableTransitions: true,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: Specs.DefaultSpec,
    close: Specs.DefaultSpec,
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
