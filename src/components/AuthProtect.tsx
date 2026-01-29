import { useRouter } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from './ui/Button/Button';
import Typography from './ui/Typography/Typography';

import { useAuth, useLanguage, useTheme } from '@/contexts';

interface AuthProtectProps {
  children: React.ReactNode;
}

export const AuthProtect: React.FC<AuthProtectProps> = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuth();
  const { t } = useLanguage();
  const theme = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size='large' color={theme.colors.foreground.brand_primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoggedIn) {
    return <>{children}</>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Typography variant='display' size='md' weight='bold' style={styles.title}>
          {t('auth.required.title')}
        </Typography>

        <Typography variant='text' size='md' style={styles.subtitle}>
          {t('auth.required.subtitle')}
        </Typography>

        <Button
          variant='solid'
          colorScheme='brand'
          size='lg'
          onPress={() => router.push('/signin')}
          style={styles.button}
        >
          {t('auth.signIn.title')}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    iconContainer: {
      marginBottom: 32,
      width: 200,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    title: {
      textAlign: 'center',
      marginBottom: 12,
      color: theme.colors.text.primary,
    },
    subtitle: {
      textAlign: 'center',
      marginBottom: 32,
      color: theme.colors.text.secondary,
    },
    button: {
      width: '100%',
      maxWidth: 300,
    },
  });
