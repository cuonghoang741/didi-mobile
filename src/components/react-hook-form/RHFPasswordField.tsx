import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import PasswordField, { type PasswordFieldProps } from '../form/PasswordField/PasswordField';

interface RHFPasswordFieldProps extends PasswordFieldProps {
  name: string;
}

const RHFPasswordField: React.FC<RHFPasswordFieldProps> = ({ name, ...others }) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <PasswordField
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

export default RHFPasswordField;
