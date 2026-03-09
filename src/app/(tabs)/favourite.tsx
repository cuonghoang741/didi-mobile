import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button, AuthProtect, ProductCard } from '@/components';
import { useTheme, useLanguage, useAuth } from '@/contexts';
import { fetchFavorites } from '@/services/supabase';
import type { Product } from '@/types/database.types';
import { useFocusEffect } from '@react-navigation/native';

const Favourite = () => {
  const theme = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);
  const router = useRouter();
  const { user } = useAuth();

  const [favourites, setFavourites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await fetchFavorites(user.id);
      setFavourites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFavorites();
    }, [loadFavorites]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  return (
    <AuthProtect>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Typography variant='display' size='sm' weight='bold'>
            {t('tabs.favourite')}
          </Typography>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={theme.colors.text.brand_primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {favourites.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Feather name='heart' size={48} color='#EF4444' />
                </View>
                <Typography variant='display' size='xs' weight='bold' style={styles.emptyTitle}>
                  {t('favourite.empty')}
                </Typography>
                <Typography variant='text' size='sm' style={styles.emptyText}>
                  {t('favourite.emptyDescription')}
                </Typography>
                <Button
                  variant='solid'
                  colorScheme='brand'
                  size='md'
                  onPress={() => router.push('/')}
                  style={styles.browseButton}
                >
                  {t('favourite.browseProducts')}
                </Button>
              </View>
            ) : (
              <View style={styles.productsGrid}>
                {favourites.map((product) => (
                  <View key={product.id} style={{ width: '48%' }}>
                    <ProductCard
                      product={product}
                      onPress={handleProductPress}
                      width={undefined} // Let it take full width of container
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      backgroundColor: '#FEE2E2',
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
