import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '@/contexts';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
}

const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', style }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          height: orientation === 'horizontal' ? 1 : '100%',
          width: orientation === 'vertical' ? 1 : '100%',
          backgroundColor: theme.colors.border.secondary,
        },
        style,
      ]}
    />
  );
};

export default Divider;
