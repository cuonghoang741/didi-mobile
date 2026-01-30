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
  Header,
} from '@/components';
import { useTheme, useLanguage, useCart } from '@/contexts';
import { fetchHomeData, HomeData } from '@/services/supabase';
import type { Banner, Product } from '@/types/database.types';
import { getLocalizedContent } from '@/utils/language';

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t, language } = useLanguage();
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
    router.push({ pathname: '/(tabs)/categories', params: { id: category.id } });
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
      <Header searchPlaceholder={t('home.searchPlaceholder')} />

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
            categories={data.categoriesWithProducts.map((c) => ({
              ...c.category,
              name: getLocalizedContent(c.category.language, 'name', language, c.category.name),
            }))}
            onCategoryPress={handleCategoryPress}
          />
        )}

        {data?.flashSale && data.flashSaleProducts.length > 0 && (
          <FlashSaleSection
            flashSale={data.flashSale}
            products={data.flashSaleProducts.map((p) => ({
              ...p,
              name: getLocalizedContent(p.language, 'name', language, p.name),
            }))}
            onProductPress={handleProductPress}
            onViewAll={() => console.log('View all flash sale')}
          />
        )}

        {data?.featuredProducts && data.featuredProducts.length > 0 && (
          <ProductSection
            title={t('home.featuredProducts')}
            products={data.featuredProducts.map((p) => ({
              ...p,
              name: getLocalizedContent(p.language, 'name', language, p.name),
            }))}
            onProductPress={handleProductPress}
            onViewAll={() => console.log('View all featured')}
            showHotBadge={true}
          />
        )}

        {data?.categoriesWithProducts.slice(0, 2).map((item) => (
          <ProductSection
            key={item.category.id}
            title={getLocalizedContent(item.category.language, 'name', language, item.category.name)}
            products={item.products.map((p) => ({
              ...p,
              name: getLocalizedContent(p.language, 'name', language, p.name),
            }))}
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
            title={getLocalizedContent(item.category.language, 'name', language, item.category.name)}
            products={item.products.map((p) => ({
              ...p,
              name: getLocalizedContent(p.language, 'name', language, p.name),
            }))}
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
    scrollContent: {
      paddingBottom: 24,
      paddingTop: 12,
    },
    secondaryBannersContainer: {
      gap: 16,
      marginBottom: 24,
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
