import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import FormHintText from '@/components/form/FormHintText/FormHintText';
import FormLabel from '@/components/form/FormLabel/FormLabel';
import { useTheme } from '@/contexts';

export interface TextAreaProps extends TextInputProps {
  label?: string;
  startIcon?: React.ElementType;
  endIcon?: React.ElementType;
  endContent?: React.ReactNode;
  startContent?: React.ReactNode;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  size?: 'sm' | 'md';
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  required,
  disabled,
  error,
  value,
  style,
  inputContainerStyle,
  containerStyle,

  onFocus,
  onBlur,
  onChangeText,

  size = 'md',
  numberOfLines = 5,
  ...others
}) => {
  const theme = useTheme();
  const styles = createStyles(theme, size);

  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <FormLabel label={label} required={required} /> : null}

      <Pressable
        style={[
          styles.inputContainer(numberOfLines),
          inputContainerStyle,
          isFocused ? styles.inputContainerFocused : undefined,
          disabled ? styles.inputContainerDisabled : undefined,
        ]}
        onPress={handlePress}
      >
        <TextInput
          ref={inputRef}
          autoCapitalize='none'
          placeholderTextColor={theme.colors.text.placeholder}
          {...others}
          value={value}
          onChangeText={onChangeText}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, style, disabled && styles.inputDisabled]}
          editable={!disabled}
          multiline
          numberOfLines={numberOfLines}
        />
      </Pressable>

      {error ? <FormHintText hintText={error} /> : null}
    </View>
  );
};

const createStyles = (
  theme: ReturnType<typeof useTheme>,
  size: NonNullable<TextAreaProps['size']>,
) => {
  const staticStyles = StyleSheet.create({
    container: {
      width: '100%',
      gap: 6,
    },
    inputContainerFocused: {
      borderColor: theme.colors.border.brand,
      backgroundColor: theme.colors.background.primary_alt,
    },
    input: {
      flex: 1,
      textAlignVertical: 'top',
      color: theme.colors.text.primary,
      ...theme.typography.text.md,
      lineHeight: 20,
      fontWeight: '400',
      padding: 0,
      margin: 0,
    },
    inputDisabled: {
      color: theme.colors.text.tertiary,
    },
    inputContainerDisabled: {
      backgroundColor: theme.colors.background.disabled,
    },
  });

  const inputContainer = (numberOfLines: number) => ({
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: theme.spacing(2),
    minHeight: 46 + (numberOfLines - 1) * 20,

    backgroundColor: theme.colors.background.primary_alt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,

    ...theme.shadows.xs,

    ...(size === 'sm'
      ? { paddingVertical: 8, paddingHorizontal: 12 }
      : { paddingVertical: 12, paddingHorizontal: 14 }),
  });

  return { ...staticStyles, inputContainer } as const;
};

export default TextArea;
