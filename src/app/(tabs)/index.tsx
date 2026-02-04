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
  BannerSkeleton,
  HomeCategoriesSkeleton,
  SectionSkeleton,
} from '@/components';
import { useTheme, useLanguage, useCart } from '@/contexts';
import {
  fetchHomeData,
  fetchBanners,
  fetchHomeCategories,
  fetchActiveFlashSale,
  fetchFeaturedProducts,
  fetchCategoriesWithProducts,
  HomeData,
} from '@/services/supabase';
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
  const [data, setData] = useState<Partial<HomeData>>({});

  const loadData = async () => {
    // Reset refreshing state if we are pulling to refresh, but don't wipe data immediately to avoid flash
    // unless it's a full reload. For smooth update, we keep old data until new comes?
    // User wants "loading xong phần nào hiện phần đó".
    // If refreshing, maybe we want to keep showing old data or show skeletons? Standard is spinner on top.

    // Independent fetches
    const fetchBannersTask = fetchBanners().then(banners => {
      setData(prev => ({ ...prev, banners }));
    }).catch(err => console.error('Banners fetch error', err));

    const fetchCategoriesTask = fetchHomeCategories().then(categories => {
      setData(prev => ({ ...prev, categories }));
    }).catch(err => console.error('Categories fetch error', err));

    const fetchFlashSaleTask = fetchActiveFlashSale().then(result => {
      setData(prev => ({
        ...prev,
        flashSale: result.flashSale,
        flashSaleProducts: result.products
      }));
    }).catch(err => console.error('Flash sale fetch error', err));

    const fetchFeaturedTask = fetchFeaturedProducts().then(featuredProducts => {
      setData(prev => ({ ...prev, featuredProducts }));
    }).catch(err => console.error('Featured products fetch error', err));

    // Load categories with products (split into initial batch and rest if needed, but 5 is okay)
    const fetchCatProductsTask = fetchCategoriesWithProducts(5, 5).then(categoriesWithProducts => {
      setData(prev => ({ ...prev, categoriesWithProducts }));
    }).catch(err => console.error('Category products fetch error', err));

    // We don't await all here for the UI update, but we want to know when to stop "refreshing" spinner
    await Promise.allSettled([
      fetchBannersTask,
      fetchCategoriesTask,
      fetchFlashSaleTask,
      fetchFeaturedTask,
      fetchCatProductsTask
    ]);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Optional: Only clear data if you want to show skeletons again. 
    // Usually keep data and just show spinner.
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




  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header searchPlaceholder={t('home.searchPlaceholder')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {data.banners ? (
          data.banners.length > 0 && (
            <BannerCarousel banners={data.banners} onBannerPress={handleBannerPress} />
          )
        ) : (
          <View style={{ paddingTop: 16 }}>
            <BannerSkeleton />
          </View>
        )}

        {/* Categories Section */}
        {data.categories ? (
          data.categories.length > 0 && (
            <CategoryList
              categories={data.categories.map((c) => ({
                ...c,
                name: getLocalizedContent(c.languages, 'name', language, c.name),
              }))}
              onCategoryPress={handleCategoryPress}
            />
          )
        ) : (
          <HomeCategoriesSkeleton />
        )}

        {/* Flash Sale - Only show if we have data or handle loading? 
            Standard: Show skeleton until loaded. If loaded and no flash sale, show nothing.
        */}
        {data.flashSaleProducts ? (
          data.flashSale && data.flashSaleProducts.length > 0 && (
            <FlashSaleSection
              flashSale={data.flashSale}
              products={data.flashSaleProducts.map((p) => ({
                ...p,
                name: getLocalizedContent(p.language, 'name', language, p.name),
              }))}
              onProductPress={handleProductPress}
              onViewAll={() => router.push('/(tabs)/categories')}
            />
          )
        ) : (
          <SectionSkeleton isFlashSale />
        )}

        {data.featuredProducts ? (
          data.featuredProducts.length > 0 && (
            <ProductSection
              title={t('home.featuredProducts')}
              products={data.featuredProducts.map((p) => ({
                ...p,
                name: getLocalizedContent(p.language, 'name', language, p.name),
              }))}
              onProductPress={handleProductPress}
              onViewAll={() => router.push('/(tabs)/categories')}
              showHotBadge={true}
            />
          )
        ) : (
          <SectionSkeleton />
        )}

        {data.categoriesWithProducts ? (
          data.categoriesWithProducts.slice(0, 2).map((item) => (
            <ProductSection
              key={item.category.id}
              title={getLocalizedContent(item.category.languages, 'name', language, item.category.name)}
              products={item.products.map((p) => ({
                ...p,
                name: getLocalizedContent(p.language, 'name', language, p.name),
              }))}
              onProductPress={handleProductPress}
              onViewAll={() => handleCategoryPress(item.category)}
            />
          ))
        ) : (
          // Show a couple of section skeletons
          <>
            <SectionSkeleton />
            <SectionSkeleton />
          </>
        )}

        {/* Display first 2 banners after top 2 categories */}
        {data.banners && data.banners.length > 0 && (
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
        {data.categoriesWithProducts &&
          data.categoriesWithProducts.slice(2, 5).map((item) => (
            <ProductSection
              key={item.category.id}
              title={getLocalizedContent(item.category.languages, 'name', language, item.category.name)}
              products={item.products.map((p) => ({
                ...p,
                name: getLocalizedContent(p.language, 'name', language, p.name),
              }))}
              onProductPress={handleProductPress}
              onViewAll={() => handleCategoryPress(item.category)}
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
