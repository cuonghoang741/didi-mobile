import React from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/contexts';

type SkeletonProps = {
  width: number | string | DimensionValue;
  height: number | string | DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
};

const Skeleton = ({ width, height, borderRadius = 4, style }: SkeletonProps) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.6, { duration: 1000, easing: Easing.ease }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const dimensionStyle = {
    width,
    height,
    borderRadius,
  } as ViewStyle;

  return <Animated.View style={[styles.skeleton, dimensionStyle, animatedStyle, style]} />;
};

const createStyles = (theme: ReturnType<typeof useTheme>) => ({
  skeleton: {
    backgroundColor: theme.colors.background.quaternary,
  },
});

export default Skeleton;
