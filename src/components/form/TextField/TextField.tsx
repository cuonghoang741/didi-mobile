import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

export interface TextFieldProps extends TextInputProps {
  label?: string;
  startIcon?: React.ElementType;
  endIcon?: React.ElementType;
  endContent?: React.ReactNode;
  startContent?: React.ReactNode;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputContainerFocusedStyle?: StyleProp<ViewStyle>;
  preventInput?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  startIcon: StartIcon,
  endIcon: EndIcon,
  endContent,
  startContent,
  required,
  clearable,
  disabled,
  error,
  value,
  style,
  inputContainerStyle,
  containerStyle,
  inputContainerFocusedStyle,
  onFocus,
  onBlur,
  onChangeText,

  size = 'md',

  preventInput = false,
  ...others
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  let sizeContainerStyle;
  if (size === 'sm') {
    sizeContainerStyle = {
      paddingVertical: theme.spacing(2),
      paddingHorizontal: theme.spacing(3),
      height: theme.spacing(10),
    };
  } else if (size === 'md') {
    sizeContainerStyle = {
      paddingVertical: theme.spacing(2.5),
      paddingHorizontal: theme.spacing(3.5),
      height: theme.spacing(12),
    };
  } else {
    sizeContainerStyle = {
      paddingVertical: theme.spacing(3),
      paddingHorizontal: theme.spacing(4),
      height: theme.spacing(14),
    };
  }

  const sizeInputStyle =
    size === 'sm'
      ? { height: theme.spacing(10) }
      : size === 'md'
        ? { height: theme.spacing(12) }
        : { height: theme.spacing(14) };

  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState<string>(value != null ? String(value) : '');

  // Sync internal state when controlled value changes
  useEffect(() => {
    if (value != null) {
      setInputValue(String(value));
    }
  }, [value]);
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const currentValue = value != null ? String(value) : inputValue;
  const isShowClearButton = useMemo(
    () => !!(clearable && isFocused && currentValue && currentValue.length > 0),
    [clearable, isFocused, currentValue],
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <FormLabel label={label} required={required} /> : null}

      <Pressable
        style={[
          styles.inputContainer,
          sizeContainerStyle,
          inputContainerStyle,
          isFocused && styles.inputContainerFocused,
          isFocused && inputContainerFocusedStyle,
          disabled && styles.inputContainerDisabled,
          error && styles.inputContainerError,
        ]}
        onPress={handlePress}
      >
        {StartIcon ? <StartIcon size={20} color={theme.colors.foreground.quaternary} /> : null}

        {startContent ? startContent : null}

        <TextInput
          ref={inputRef}
          autoCapitalize='none'
          placeholderTextColor={theme.colors.text.placeholder}
          {...others}
          value={currentValue}
          onChangeText={(text) => {
            setInputValue(text);
            onChangeText?.(text);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, sizeInputStyle, style, disabled && styles.inputDisabled]}
          editable={!disabled && !preventInput}
        />

        {EndIcon ? <EndIcon size={20} color={theme.colors.foreground.quaternary} /> : null}

        {endContent ? endContent : null}

        {!EndIcon && !endContent && isShowClearButton ? (
          <Pressable
            onPress={() => {
              setInputValue('');
              onChangeText?.('');
            }}
          >
            <Feather name='x-circle' size={20} color={theme.colors.foreground.quinary} />
          </Pressable>
        ) : null}
      </Pressable>

      {error ? <FormHintText hintText={error} /> : null}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: 6,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing(2),

      backgroundColor: theme.colors.background.primary_alt,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border.primary,

      ...theme.shadows.xs,
    },
    inputContainerFocused: {
      borderColor: theme.colors.border.brand,
      backgroundColor: theme.colors.background.primary_alt,
    },

    input: {
      flex: 1,
      color: theme.colors.text.primary,
    },

    inputDisabled: {
      color: theme.colors.text.tertiary,
    },

    inputContainerDisabled: {
      backgroundColor: theme.colors.background.disabled,
    },

    inputContainerError: {
      borderColor: theme.colors.border.border_error,
    },
  });

export default TextField;
