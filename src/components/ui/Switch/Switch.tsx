import React from 'react';
import { Switch as RNSwitch, View } from 'react-native';

import { useTheme } from '@/contexts';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({ value, onValueChange, disabled }) => {
  const theme = useTheme();

  const trackColor = {
    false: theme.colors.background.primary_hover,
    true: theme.colors.foreground.brand_primary,
  } as const;

  return (
    <View>
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={trackColor}
        thumbColor={theme.colors.text.white}
        ios_backgroundColor={theme.colors.background.primary_hover}
      />
    </View>
  );
};

export default Switch;
