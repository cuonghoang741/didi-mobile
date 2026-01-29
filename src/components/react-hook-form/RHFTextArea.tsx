import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import TextArea, { TextAreaProps } from '@/components/form/TextArea/TextArea';

interface RHFTextAreaProps extends TextAreaProps {
  name: string;
}

const RHFTextArea: React.FC<RHFTextAreaProps> = ({ name, ...others }) => {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <TextArea
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

export default RHFTextArea;
