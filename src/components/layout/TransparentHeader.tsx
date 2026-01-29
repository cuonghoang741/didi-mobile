import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { IconButton, Typography } from '@/components';
import { useTheme } from '@/contexts';

interface TransparentHeaderProps {
  title?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  variant?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}

const TransparentHeader: React.FC<TransparentHeaderProps> = ({
  title,
  canGoBack,
  onBack,
  variant = 'light',
  style,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme, variant);

  const handleBack = () => {
    if (!canGoBack) return;

    router.back();
    onBack?.();
  };

  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerLeft}>
        {canGoBack ? (
          <IconButton
            icon={(props) => <Feather name='arrow-left' size={props?.startIconSize ?? 20} />}
            onPress={handleBack}
            colorScheme='gray'
            variant='outline'
          />
        ) : null}
      </View>

      <Typography variant='display' weight='semiBold' style={styles.headerTitle}>
        {title}
      </Typography>

      <View style={styles.headerRight} />
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>, variant: 'light' | 'dark') =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 40,
    },

    headerLeft: {
      position: 'absolute',
      left: theme.spacing(4),
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },

    headerRight: {
      position: 'absolute',
      right: theme.spacing(4),
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },

    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: variant === 'light' ? theme.palette.white : theme.palette.black,
    },
  });

export default TransparentHeader;
