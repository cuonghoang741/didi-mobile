import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable } from 'react-native';

import TextField, { TextFieldProps } from '@/components/form/TextField/TextField';
import { useTheme } from '@/contexts';

export type PasswordFieldProps = Omit<TextFieldProps, 'endIcon'>;

export const PasswordField: React.FC<PasswordFieldProps> = (props) => {
  const theme = useTheme();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <TextField
      autoCapitalize='none'
      secureTextEntry={!isPasswordVisible}
      endIcon={() => (
        <Pressable
          onPress={() => {
            togglePasswordVisibility();
          }}
        >
          {isPasswordVisible ? (
            <Feather name='eye' size={20} color={theme.colors.foreground.quinary} />
          ) : (
            <Feather name='eye-off' size={20} color={theme.colors.foreground.quinary} />
          )}
        </Pressable>
      )}
      {...props}
    />
  );
};

export default PasswordField;
