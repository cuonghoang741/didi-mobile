import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components';
import { useTheme } from '@/contexts';

interface FormHintTextProps {
  hintText: string;
}

const FormHintText: React.FC<FormHintTextProps> = ({ hintText }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.errorContainer}>
      <Typography variant='text' weight='regular' size='sm' style={styles.errorMessage}>
        {hintText}
      </Typography>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing(2),
    },
    errorIcon: {
      marginLeft: theme.spacing(1),
    },
    errorMessage: {
      color: theme.colors.text.error_primary,
    },
  });

export default FormHintText;
