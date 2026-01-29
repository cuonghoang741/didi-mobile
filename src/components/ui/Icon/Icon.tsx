import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';

import { useTheme } from '@/contexts';

interface IconProps extends SvgProps {
  size: number;
  icon: React.ElementType;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const Icon: React.FC<IconProps> = ({
  size,
  icon: IconElement,
  color,
  style,
  ...props
}) => {
  const theme = useTheme();

  return (
    <IconElement
      // Support both SVG icons (width/height) and vector icons (size)
      width={size}
      height={size}
      size={size}
      color={color ?? theme.colors.text.primary}
      style={[{ color: color ?? theme.colors.text.primary }, style]}
      {...props}
    />
  );
};

export default Icon;
