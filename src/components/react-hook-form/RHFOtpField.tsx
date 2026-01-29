import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import OtpField, { OtpInputProps } from '../form/OtpField/OtpField';

interface RHFOtpFieldProps extends Omit<OtpInputProps, 'value' | 'onChange'> {
  name: string;
}

const RHFOtpField: React.FC<RHFOtpFieldProps> = ({ name, ...others }) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <OtpField {...others} value={value} onChange={onChange} error={!!error?.message} />
      )}
    />
  );
};

export default RHFOtpField;
