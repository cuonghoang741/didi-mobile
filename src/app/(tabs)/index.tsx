import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BannerCarousel,
  CategoryList,
  FlashSaleSection,
  ProductSection,
  Typography,
} from '@/components';
import { useTheme, useLanguage, useCart } from '@/contexts';
import { fetchHomeData, HomeData } from '@/services/supabase';
import type { Banner, Product } from '@/types/database.types';

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { getItemCount } = useCart();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<HomeData | null>(null);

  const loadData = async () => {
    try {
      const homeData = await fetchHomeData();
      setData(homeData);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleBannerPress = (banner: Banner) => {
    if (banner.product_id) {
      router.push(`/product/${banner.product_id}`);
    }
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleCategoryPress = (category: any) => {
    console.log('Category pressed:', category);
  };

  if (loading && !data) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size='large' color={theme.colors.text.brand_primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.searchContainer} onPress={() => router.push('/search')}>
          <Feather name='search' size={20} color={theme.colors.text.secondary} />
          <Typography variant='text' size='md' style={styles.searchText}>
            {t('home.searchPlaceholder')}
          </Typography>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => router.push('/cart')}>
          <Feather name='shopping-cart' size={24} color={theme.colors.text.primary} />
          {getItemCount() > 0 && (
            <View style={styles.badge}>
              <Typography variant='text' size='xs' style={styles.badgeText}>
                {getItemCount() > 9 ? '9+' : getItemCount()}
              </Typography>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {data?.banners && data.banners.length > 0 && (
          <BannerCarousel banners={data.banners} onBannerPress={handleBannerPress} />
        )}

        {/* Categories from categoriesWithProducts + additional categories if any */}
        {data?.categoriesWithProducts && (
          <CategoryList
            categories={data.categoriesWithProducts.map((c) => c.category)}
            onCategoryPress={handleCategoryPress}
          />
        )}

        {data?.flashSale && data.flashSaleProducts.length > 0 && (
          <FlashSaleSection
            flashSale={data.flashSale}
            products={data.flashSaleProducts}
            onProductPress={handleProductPress}
            onViewAll={() => console.log('View all flash sale')}
          />
        )}

        {data?.featuredProducts && data.featuredProducts.length > 0 && (
          <ProductSection
            title={t('home.featuredProducts')}
            products={data.featuredProducts}
            onProductPress={handleProductPress}
            onViewAll={() => console.log('View all featured')}
          />
        )}

        {data?.categoriesWithProducts.slice(0, 2).map((item) => (
          <ProductSection
            key={item.category.id}
            title={item.category.name}
            products={item.products}
            onProductPress={handleProductPress}
            onViewAll={() => console.log(`View all ${item.category.name}`)}
          />
        ))}

        {/* Display first 2 banners after top 2 categories */}
        {data?.banners && data.banners.length > 0 && (
          <View style={styles.secondaryBannersContainer}>
            {data.banners.slice(0, 2).map((banner) => (
              <Pressable
                key={`secondary-banner-${banner.id}`}
                onPress={() => handleBannerPress(banner)}
                style={styles.globalBannerContainer}
              >
                <Image
                  source={{ uri: banner.mobile_image_url || banner.image_url }}
                  style={styles.globalBannerImage}
                  contentFit='cover'
                  transition={200}
                />
              </Pressable>
            ))}
          </View>
        )}

        {/* Display remaining categories */}
        {data?.categoriesWithProducts.slice(2, 5).map((item) => (
          <ProductSection
            key={item.category.id}
            title={item.category.name}
            products={item.products}
            onProductPress={handleProductPress}
            onViewAll={() => console.log(`View all ${item.category.name}`)}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      gap: 8,
    },
    searchText: {
      color: theme.colors.text.tertiary,
    },
    iconButton: {
      padding: 4,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },
    scrollContent: {
      paddingBottom: 24,
      paddingTop: 12,
    },
    secondaryBannersContainer: {
      gap: 16,
      marginTop: 24,
      paddingHorizontal: 16,
    },
    globalBannerContainer: {
      width: '100%',
      height: 150,
      borderRadius: 12,
      overflow: 'hidden',
    },
    globalBannerImage: {
      width: '100%',
      height: '100%',
    },
  });

export default Home;
