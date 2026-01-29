import React from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';

import { Typography } from '@/components';
import { useTheme } from '@/contexts';

interface FormLabelProps {
  label: string;
  required?: boolean;
  style?: StyleProp<TextStyle>;
}

const FormLabel: React.FC<FormLabelProps> = ({ label, required = false, style }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Typography variant='text' size='sm' weight='medium' style={[styles.label, style]}>
      {label}

      {required ? (
        <Typography variant='text' size='sm' weight='medium' style={styles.required}>
          {' *'}
        </Typography>
      ) : null}
    </Typography>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    label: {
      color: theme.colors.text.secondary,
    },
    required: {
      color: theme.colors.text.error_primary,
    },
  });

export default FormLabel;
