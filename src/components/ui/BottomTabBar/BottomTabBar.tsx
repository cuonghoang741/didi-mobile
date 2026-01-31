import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '@/contexts';

import BottomTabBarButton from './BottomTabBarButton';

const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const theme = useTheme();
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;
  const [tabPositions, setTabPositions] = useState<number[]>([]);

  // Calculate tab positions when layout changes
  const handleLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const { width } = event.nativeEvent.layout;
    const tabWidth = width / state.routes.length;
    const positions = state.routes.map((_, index) => index * tabWidth);
    setTabPositions(positions);
  };

  // Animate indicator when tab changes
  useEffect(() => {
    if (tabPositions.length > 0) {
      Animated.spring(indicatorAnim, {
        toValue: state.index,
        useNativeDriver: false,
        tension: 150,
        friction: 7,
      }).start();
    }
  }, [state.index, indicatorAnim, tabPositions]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background.primary,
          borderTopColor: theme.colors.border.tertiary,
          paddingHorizontal: theme.spacing(2),
        },
      ]}
      onLayout={handleLayout}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const handleLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <BottomTabBarButton
            key={route.key}
            focused={isFocused}
            onPress={handlePress}
            onLongPress={handleLongPress}
            options={options}
          />
        );
      })}

      {/* Animated indicator */}
      {tabPositions.length > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: theme.colors.text.primary,
              left: indicatorAnim.interpolate({
                inputRange: tabPositions.map((_, i) => i),
                outputRange: tabPositions,
              }),
              width: tabPositions.length > 1 ? tabPositions[1] - tabPositions[0] : '100%',
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    borderRadius: 1.5,
  },
});

export default BottomTabBar;
