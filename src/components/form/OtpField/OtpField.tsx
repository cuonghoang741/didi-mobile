import React, { useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { useTheme } from '@/contexts';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  numberOfDigits?: number;
  error?: boolean;
}

export const OtpField: React.FC<OtpInputProps> = ({
  value,
  onChange,
  numberOfDigits = 4,
  error,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const inputRefs = useRef<TextInput[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split('');

    newValue[index] = text;
    onChange(newValue.join(''));

    if (text && index < numberOfDigits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newValue = value.split('');

      if (value[index]) {
        newValue[index] = '';
        onChange(newValue.join(''));

        return;
      }

      if (index > 0) {
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array(numberOfDigits)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.input,
              focusedIndex === index && styles.inputFocused,
              value[index] && styles.inputFilled,
              error && styles.inputError,
            ]}
            value={value[index] || ''}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(-1)}
            keyboardType='number-pad'
            maxLength={1}
            selectTextOnFocus
            placeholder='0'
          />
        ))}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
      gap: theme.spacing['4xl'],
    },
    input: {
      aspectRatio: 1,
      height: 56,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      borderColor: theme.colors.border.primary,
      backgroundColor: theme.colors.background.primary,
      textAlign: 'center',
      fontSize: 36,
      fontWeight: '600',
      color: theme.colors.text.brand_tertiary,
    },
    inputFocused: {
      borderWidth: 1.5,
      borderColor: theme.colors.border.brand,
      backgroundColor: theme.colors.background.brand_primary,
    },
    inputFilled: {
      borderWidth: 1.5,
      borderColor: theme.colors.border.primary,
      backgroundColor: theme.colors.background.primary,
    },
    inputError: {
      borderWidth: 1,
      borderColor: theme.colors.border.border_error,
      backgroundColor: theme.colors.background.primary,
    },
  });

export default OtpField;
