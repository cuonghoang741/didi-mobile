import { Feather } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button, AuthProtect } from '@/components';
import { useTheme, useLanguage } from '@/contexts';

const Favourite = () => {
  const theme = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // TODO: Fetch favourite products from API
  const favourites: any[] = [];

  return (
    <AuthProtect>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Typography variant='display' size='sm' weight='bold'>
            {t('tabs.favourite')}
          </Typography>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {favourites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Feather name='heart' size={48} color={theme.colors.text.brand_primary} />
              </View>
              <Typography variant='display' size='xs' weight='bold' style={styles.emptyTitle}>
                {t('favourite.empty')}
              </Typography>
              <Typography variant='text' size='sm' style={styles.emptyText}>
                {t('favourite.emptyDescription')}
              </Typography>
              <Button
                colorScheme='brand'
                size='md'
                variant='solid'
                onPress={() => console.log('Browse products')}
                style={styles.browseButton}
              >
                {t('favourite.browseProducts')}
              </Button>
            </View>
          ) : (
            <View style={styles.productsGrid}>{/* Product list will go here */}</View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AuthProtect>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.tertiary,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
    },
    emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.background.brand_primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      marginBottom: 8,
    },
    emptyText: {
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginBottom: 24,
    },
    browseButton: {
      minWidth: 160,
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
  });

export default Favourite;
