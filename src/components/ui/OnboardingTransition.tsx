import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingTransitionProps {
  children: React.ReactNode;
  exit: boolean;
  exitDirection?: 'left' | 'right';
  onExitComplete?: () => void;
  style?: any;
}

export const OnboardingTransition = React.memo(({
  children,
  exit,
  exitDirection = 'left',
  onExitComplete,
  style,
}: OnboardingTransitionProps) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const currentTarget = useRef(0); // 0 = entering, 1 = active, 2 = exiting

  // Use refs for interpolation to avoid creating new interpolations during rerenders
  const translateX = useRef(animValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [SCREEN_WIDTH, 0, -SCREEN_WIDTH],
  })).current;



  const onExitCompleteRef = useRef(onExitComplete);

  useEffect(() => {
    onExitCompleteRef.current = onExitComplete;
  }, [onExitComplete]);

  useEffect(() => {
    if (!exit) {
      if (currentTarget.current === 2) {
        // Returning back from exit state: slide in from left
        currentTarget.current = 1;
        Animated.timing(animValue, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      } else {
        // Initial mount entry: slide in from right
        animValue.setValue(0);
        currentTarget.current = 1;
        Animated.timing(animValue, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [exit]);

  useEffect(() => {
    if (exit) {
      const targetValue = exitDirection === 'right' ? 0 : 2;
      currentTarget.current = targetValue;
      Animated.timing(animValue, {
        toValue: targetValue,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onExitCompleteRef.current) {
          onExitCompleteRef.current();
        }
      });
    }
  }, [exit, exitDirection]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ translateX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
