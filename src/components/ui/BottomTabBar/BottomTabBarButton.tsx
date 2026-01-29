import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts';
import { type TabBarIconProps } from '@/types';

import Typography from '../Typography/Typography';

interface BottomTabBarButtonProps {
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  options: BottomTabNavigationOptions;
}

const BottomTabBarButton: React.FC<BottomTabBarButtonProps> = ({
  focused,
  options,
  onPress,
  onLongPress,
}) => {
  const { title, tabBarIcon } = options;
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const styles = createStyles(theme);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (!tabBarIcon) return null;

  const handlePress = () => {
    onPress();
  };

  const handlePressIn = () => {
    // Scale down animation
    Animated.spring(scaleAnim, {
      toValue: 0.8,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    // Scale back to normal
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  };

  const iconColor = focused ? theme.colors.foreground.brand_primary : theme.colors.text.quaternary;
  const iconSize = theme.spacing(6);
  const iconVariant = focused ? 'Bold' : 'Linear';

  return (
    <Pressable
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, { paddingBottom: theme.spacing(2) + bottom }]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {tabBarIcon({
          color: iconColor,
          size: iconSize,
          focused,
          variant: iconVariant,
        } as TabBarIconProps)}
      </Animated.View>

      {title ? (
        <Typography
          variant='text'
          size='xs'
          weight='medium'
          style={[
            styles.text,
            {
              color: focused ? theme.colors.foreground.brand_primary : theme.colors.text.quaternary,
            },
          ]}
        >
          {title}
        </Typography>
      ) : null}
    </Pressable>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing(1),
      paddingTop: theme.spacing(3),
      position: 'relative',
    },
    text: {
      fontWeight: '600',
    },
  });

export default BottomTabBarButton;
