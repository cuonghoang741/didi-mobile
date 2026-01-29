import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import TextField, { TextFieldProps } from '../form/TextField/TextField';

interface RHFTextFieldProps extends TextFieldProps {
  name: string;
}

const RHFTextField: React.FC<RHFTextFieldProps> = ({ name, ...others }) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <TextField
          {...others}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
        />
      )}
    />
  );
};

export default RHFTextField;
