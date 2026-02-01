import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  FloatingContactButton,
  HomeSkeleton,
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
    // Priority: product_id > category_id > link_url
    if (banner.product_id) {
      router.push(`/product/${banner.product_id}`);
    } else if (banner.category_id) {
      router.push({ pathname: '/(tabs)/categories', params: { id: banner.category_id } });
    } else if (banner.link_url) {
      // For external links, you might want to use Linking.openURL
      console.log('External link:', banner.link_url);
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header searchPlaceholder={t('home.searchPlaceholder')} />
        <HomeSkeleton />
      </SafeAreaView>
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

        {/* Categories Section */}
        {data?.categories && data.categories.length > 0 && (
          <CategoryList
            categories={data.categories.map((c) => ({
              ...c,
              name: getLocalizedContent(c.languages, 'name', language, c.name),
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
            title={getLocalizedContent(item.category.languages, 'name', language, item.category.name)}
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
                <LinearGradient
                  colors={['transparent', banner.button_text ? 'rgba(0,0,0,0.7)' : 'transparent']}
                  style={styles.bannerOverlay}
                >
                  <View style={styles.bannerTextContainer}>
                    {banner.button_text && banner.subtitle ? (
                      <Typography variant='text' size='sm' style={styles.bannerSubtitle}>
                        {banner.subtitle}
                      </Typography>
                    ) : null}
                    {banner.button_text && banner.title ? (
                      <Typography variant='text' size='lg' weight='bold' style={styles.bannerTitle}>
                        {banner.title}
                      </Typography>
                    ) : null}
                    {banner.button_text ? (
                      <View style={styles.bannerButton}>
                        <Typography variant='text' size='xs' weight='semiBold' style={styles.bannerButtonText}>
                          {banner.button_text}
                        </Typography>
                      </View>
                    ) : null}
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        )}

        {/* Display remaining categories */}
        {data?.categoriesWithProducts.slice(2, 5).map((item) => (
          <ProductSection
            key={item.category.id}
            title={getLocalizedContent(item.category.languages, 'name', language, item.category.name)}
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

      {/* Floating Contact Button */}
      <FloatingContactButton />
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
    bannerOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '70%',
      justifyContent: 'flex-end',
      padding: 16,
    },
    bannerTextContainer: {
      gap: 4,
    },
    bannerSubtitle: {
      color: 'rgba(255,255,255,0.85)',
    },
    bannerTitle: {
      color: '#FFFFFF',
    },
    bannerButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginTop: 6,
    },
    bannerButtonText: {
      color: '#FFFFFF',
    },
  });

export default Home;
