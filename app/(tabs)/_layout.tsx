import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/providers/theme-provider';

const { width: screenWidth } = Dimensions.get('window');

function TabBarButton({
  route,
  isFocused,
  onPress,
  onLongPress,
  index,
  tabWidth,
}: {
  route?: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  index: number;
  tabWidth: number;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1.0 : 0.8);

  useEffect(() => {
    opacity.value = withTiming(isFocused ? 1.0 : 0.8, { duration: 200 });
  }, [isFocused]);

  const handlePressIn = () => {
    scale.value = withTiming(0.93, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 15, stiffness: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconColor = isFocused ? theme.tabBarActive : theme.tabBarInactive;

  if (index === 2) {
    // Insights is the primary destination. Styled as a dark circle.
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ width: tabWidth, height: 68, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View style={[styles.insightsButton, animatedStyle]}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isFocused ? theme.primary : "#FDFCF8"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <Path d="M9 18h6" />
            <Path d="M10 22h4" />
          </Svg>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: tabWidth, height: 68, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        {route?.name === 'index' && (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <Path d="M9 22V12h6v10" />
          </Svg>
        )}
        {route?.name === 'transactions' && (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <Path d="M9 11h6" />
            <Path d="M9 15h6" />
          </Svg>
        )}
        {route?.name === 'settings' && (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="3" />
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </Svg>
        )}
        {index === 4 && (
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10" />
            <Path d="M12 8v8" />
            <Path d="M8 12h8" />
          </Svg>
        )}
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom > 0 ? insets.bottom : 12;
  const tabBarWidth = screenWidth;
  const tabWidth = tabBarWidth / 5;
  const activeIndex = state.index;

  const translateX = useSharedValue(state.index * tabWidth + (tabWidth - 16) / 2);
  const underlineOpacity = useSharedValue(state.index === 2 ? 0 : 1);

  useEffect(() => {
    if (activeIndex === 2) {
      underlineOpacity.value = withTiming(0, { duration: 150 });
    } else {
      underlineOpacity.value = withTiming(1, { duration: 150 });
      const targetX = activeIndex * tabWidth + (tabWidth - 16) / 2;
      translateX.value = withSpring(targetX, {
        damping: 20,
        stiffness: 150,
        mass: 0.5,
      });
    }
  }, [activeIndex, tabWidth]);

  const animatedUnderlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: underlineOpacity.value,
  }));

  return (
    <View
      style={[
        styles.standardTabBar,
        {
          height: 68 + safeBottom,
          paddingBottom: safeBottom,
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.activeUnderline,
          {
            backgroundColor: theme.tabBarActive,
            bottom: 9 + safeBottom,
          },
          animatedUnderlineStyle,
        ]}
      />
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarButton
            key={route.key}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            index={index}
            tabWidth={tabWidth}
          />
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      // @ts-ignore
      sceneContainerStyle={{ backgroundColor: theme.background }}
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="settings" />
      <Tabs.Screen
        name="add-transaction"
        options={{
          href: null,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/add-transaction');
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  standardTabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Very subtle shadow
    shadowColor: '#1F1F1F',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  activeUnderline: {
    width: 16,
    height: 2,
    position: 'absolute',
    left: 0,
  },
  insightsButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
  },
});
