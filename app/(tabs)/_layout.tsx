import React, { useEffect, useRef } from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { View, StyleSheet, Pressable, Dimensions, Text, Animated } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/providers/theme-provider';
import { typography, tokens } from '@/theme';

const { width: screenWidth } = Dimensions.get('window');

function TabBarButton({
  isFocused,
  onPress,
  onLongPress,
  index,
  tabWidth,
}: {
  isFocused: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  index: number;
  tabWidth: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(isFocused ? 1.0 : 0.6)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isFocused ? 1.0 : 0.6,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.93,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1.0,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const activeColor = '#3E5A2A'; // Forest green
  const inactiveColor = '#8E8A82'; // Muted text
  const iconColor = isFocused ? activeColor : inactiveColor;

  const getLabelText = () => {
    switch (index) {
      case 0: return 'Home';
      case 1: return 'History';
      case 2: return 'Insights';
      case 3: return 'Settings';
      case 4: return 'Add';
      default: return '';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ width: tabWidth, height: 70, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
        {index === 0 && (
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <Path d="M9 22V12h6v10" />
          </Svg>
        )}
        {index === 1 && (
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <Path d="M9 11h6" />
            <Path d="M9 15h6" />
          </Svg>
        )}
        {index === 2 && (
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <Path d="M9 18h6" />
            <Path d="M10 22h4" />
          </Svg>
        )}
        {index === 3 && (
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="3" />
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </Svg>
        )}
        {index === 4 && (
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10" />
            <Path d="M12 8v8" />
            <Path d="M8 12h8" />
          </Svg>
        )}
        <Text style={[styles.tabLabel, { color: iconColor }]}>
          {getLabelText()}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors: _descriptors, navigation }: BottomTabBarProps) {
  const tabBarWidth = screenWidth - 40; // Floating margin layout
  const tabWidth = tabBarWidth / 5;
  const activeIndex = state.index;

  const translateX = useRef(new Animated.Value(state.index * tabWidth + (tabWidth - 16) / 2)).current;

  useEffect(() => {
    const targetX = activeIndex * tabWidth + (tabWidth - 16) / 2;
    Animated.spring(translateX, {
      toValue: targetX,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, tabWidth]);

  return (
    <View style={styles.standardTabBar}>
      <Animated.View
        style={[
          styles.activeUnderline,
          {
            backgroundColor: '#3E5A2A',
            bottom: 6,
            transform: [{ translateX }],
          },
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
  const pathname = usePathname();
  const sceneBackground = pathname.includes('/settings')
    ? '#E1D7C2'
    : pathname.includes('/insights')
    ? tokens.colors.background
    : tokens.colors.tactileBackground;

  return (
    <Tabs
      // @ts-ignore
      sceneContainerStyle={{ backgroundColor: sceneBackground }}
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
    left: 20,
    right: 20,
    bottom: 24,
    height: 70,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFF8EE',
    borderWidth: 1,
    borderColor: '#E6E1D8',
    // Soft diffused editorial shadow
    shadowColor: '#745143',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  activeUnderline: {
    width: 16,
    height: 2,
    position: 'absolute',
    left: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 50,
  },
  tabLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 9,
    marginTop: 2,
  },
});
