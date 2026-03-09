import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header, Typography, CategoriesSkeleton } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { useCurrency } from '@/hooks';
import { getLocalizedContent } from '@/utils/language';
import { fetchCategories, supabase, enrichProductsWithVariantPrices } from '@/services/supabase';
import { fetchBrandsFromTable } from '@/services/supabase/productService';
import type { Category, Product, Brand } from '@/types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LEFT_PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.22, 100);

const Categories = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t, language } = useLanguage();
  const { id } = useLocalSearchParams();
  const styles = createStyles(theme);
  const { formatJpy } = useCurrency();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      if (id) {
        const found = categories.find((c) => c.id === id);
        if (found) {
          setSelectedCategory(found);
          return;
        }
      }
      // Default to first if no id or not found, but only if selectedCategory is not set
      if (!selectedCategory) {
        setSelectedCategory(categories[0]);
      }
    }
  }, [categories, id]);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts();
    }
  }, [selectedCategory, selectedBrand]);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const data = await fetchBrandsFromTable();
      setBrands(data);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadProducts = async () => {
    if (!selectedCategory) return;

    setLoadingProducts(true);
    try {
      console.log(
        '[DEBUG Categories] Loading products for category:',
        selectedCategory.id,
        selectedCategory.name,
      );

      // 1. Get product_ids from junction table
      const { data: junctionData, error: junctionError } = await supabase
        .from('product_categories_junction')
        .select('product_id')
        .eq('category_id', selectedCategory.id);

      console.log('[DEBUG Categories] Junction result:', {
        junctionData: junctionData?.length || 0,
        junctionError,
        rawData: junctionData,
      });

      if (junctionError) {
        console.error('Error fetching junction:', junctionError);
        setProducts([]);
        return;
      }

      const productIds = junctionData?.map((j) => j.product_id) || [];

      if (productIds.length === 0) {
        console.log('[DEBUG Categories] No product IDs found in junction - setting empty products');
        setProducts([]);
        return;
      }

      console.log('[DEBUG Categories] Product IDs found:', productIds);

      // 2. Fetch products details
      let query = supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .is('deleted_at', null)
        // @ts-ignore: status column exists in DB but not in types
        .eq('status', 'active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Filter by brand if selected
      if (selectedBrand) {
        query = query.eq('brand_id', selectedBrand.id);
      }

      const { data, error: productsError } = await query.limit(50);
      console.log('[DEBUG Categories] Products query result:', {
        productsCount: data?.length || 0,
        productsError,
      });
      setProducts(data || []);

      // 3. Enrich products with variant prices (same logic as product detail)
      if (data && data.length > 0) {
        const enrichedProducts = await enrichProductsWithVariantPrices(data);
        setProducts(enrichedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const filteredCategories = categories.filter((c) => {
    const name = getLocalizedContent(c.languages, 'name', language, c.name);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory?.id === item.id;
    const name = getLocalizedContent(item.languages, 'name', language, item.name);
    return (
      <Pressable
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => setSelectedCategory(item)}
      >
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/60' }}
          style={styles.categoryItemImage}
          contentFit='contain'
        />
        <Typography
          variant='text'
          size='xs'
          weight={isSelected ? 'bold' : 'medium'}
          style={[styles.categoryName, isSelected && styles.categoryNameSelected]}
        >
          {name}
        </Typography>
      </Pressable>
    );
  };

  const renderAllBrandItem = () => {
    const isSelected = selectedBrand === null;
    return (
      <Pressable
        key='all'
        style={[styles.brandChip, isSelected && styles.brandChipSelected]}
        onPress={() => setSelectedBrand(null)}
      >
        <Typography
          variant='text'
          size='sm'
          weight={isSelected ? 'semiBold' : 'regular'}
          style={[styles.brandText, isSelected && styles.brandTextSelected]}
        >
          {t('common.all') || 'Tất cả'}
        </Typography>
      </Pressable>
    );
  };

  const renderBrandItem = (brand: Brand) => {
    const isSelected = selectedBrand?.id === brand.id;
    const brandName = getLocalizedContent(brand.languages, 'name', language, brand.name);
    return (
      <Pressable
        key={brand.id}
        style={[styles.brandChip, isSelected && styles.brandChipSelected]}
        onPress={() => setSelectedBrand(brand)}
      >
        {brand.logo_url && (
          <Image source={{ uri: brand.logo_url }} style={styles.brandLogo} contentFit='contain' />
        )}
        <Typography
          variant='text'
          size='sm'
          weight={isSelected ? 'semiBold' : 'regular'}
          style={[styles.brandText, isSelected && styles.brandTextSelected]}
        >
          {brandName}
        </Typography>
      </Pressable>
    );
  };

  const renderProductItem = (item: Product) => {
    const productName = getLocalizedContent(item.language, 'name', language, item.name);

    // The product has already been enriched in homeService with the lowest variant price set to sale_price
    // So we just take sale_price (or base_price as fallback)
    const price = item.sale_price || item.base_price || 0;

    // Treat base_price as original price if sale_price is set, but be careful with variants
    // As variant enrichment just sets the lowest variant price to sale_price, without keeping the base_price
    // So we'll show discount only if there's a clear sale vs base difference
    const originalPrice =
      item.base_price && item.sale_price && item.sale_price < item.base_price
        ? item.base_price
        : null;

    const imageUri =
      item.thumbnail_url || item.image_urls?.[0] || 'https://via.placeholder.com/100';
    const discountPercent =
      originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    return (
      <Pressable key={item.id} style={styles.productItem} onPress={() => handleProductPress(item)}>
        <Image source={{ uri: imageUri }} style={styles.productImage} contentFit='cover' />
        <View style={styles.productInfo}>
          <Typography variant='text' size='sm' numberOfLines={2} style={styles.productName}>
            {productName}
          </Typography>
          <Typography variant='text' size='sm' weight='bold' style={styles.productPrice}>
            {formatJpy(price)}
          </Typography>
          {originalPrice && discountPercent > 0 ? (
            <View style={styles.originalPriceRow}>
              <Typography variant='text' size='xs' style={styles.originalPrice}>
                {formatJpy(originalPrice)}
              </Typography>
              <Typography variant='text' size='xs' weight='medium' style={styles.discountPercent}>
                -{discountPercent}%
              </Typography>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          isSearchInput
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('common.search')}
        />
        <CategoriesSkeleton />
      </SafeAreaView>
    );
  }

  const selectedCategoryName = selectedCategory
    ? getLocalizedContent(selectedCategory.languages, 'name', language, selectedCategory.name)
    : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        isSearchInput
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('common.search')}
      />

      <View style={styles.content}>
        {/* Left Panel: Categories */}
        <View style={styles.leftPanel}>
          <FlatList
            data={filteredCategories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        {/* Right Panel: Brand & Subcategories */}
        <ScrollView style={styles.rightPanel} showsVerticalScrollIndicator={false}>
          {selectedCategory && (
            <>
              {/* Category Title */}
              <View style={styles.categoryTitleContainer}>
                <Typography variant='text' size='lg' weight='bold' style={styles.categoryTitle}>
                  {selectedCategoryName}
                </Typography>
              </View>

              {/* Brands Section */}
              {brands.length > 0 && (
                <View style={styles.brandsSection}>
                  <Typography
                    variant='text'
                    size='md'
                    weight='semiBold'
                    style={styles.sectionTitle}
                  >
                    {t('categories.brand') || 'Thương hiệu'}
                  </Typography>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.brandsRow}>
                      {renderAllBrandItem()}
                      {brands.map((brand) => renderBrandItem(brand))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Products Section */}
              <View style={styles.productsSection}>
                {loadingProducts ? (
                  <View style={[styles.center, { paddingVertical: 40 }]}>
                    <ActivityIndicator color={theme.colors.text.brand_primary} />
                  </View>
                ) : products.length > 0 ? (
                  <View style={styles.productsGrid}>
                    {products.map((item) => (
                      <View key={item.id} style={styles.productWrapper}>
                        {renderProductItem(item)}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                      <Feather name='package' size={40} color={theme.colors.text.tertiary} />
                    </View>
                    <Typography variant='text' size='sm' style={styles.emptyDescription}>
                      {t('categories.emptyProducts') || 'Chưa có sản phẩm'}
                    </Typography>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
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
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      flexDirection: 'row',
    },
    leftPanel: {
      width: LEFT_PANEL_WIDTH,
      backgroundColor: theme.colors.background.secondary,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border.secondary,
    },
    rightPanel: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    categoryList: {
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    categoryItem: {
      alignItems: 'center',
      padding: 6,
      marginBottom: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    categoryItemSelected: {
      backgroundColor: theme.colors.background.primary,
      borderColor: theme.colors.text.brand_primary,
    },
    categoryItemImage: {
      width: 40,
      height: 40,
      marginBottom: 4,
    },
    categoryName: {
      color: theme.colors.text.primary,
      textAlign: 'center',
      fontSize: 10,
      lineHeight: 13,
    },
    categoryNameSelected: {
      color: theme.colors.text.brand_primary,
    },
    categoryTitleContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    categoryTitle: {
      color: theme.colors.text.primary,
    },
    // Brands Section
    brandsSection: {
      paddingHorizontal: 16,
      marginBottom: 20,
    },
    sectionTitle: {
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    brandsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    brandChip: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      backgroundColor: theme.colors.background.primary,
      minWidth: 80,
      alignItems: 'center',
      gap: 8,
    },
    brandChipSelected: {
      borderColor: theme.colors.text.brand_primary,
      backgroundColor: '#EEF2FF',
    },
    brandLogo: {
      width: 20,
      height: 20,
    },
    brandText: {
      color: theme.colors.text.secondary,
    },
    brandTextSelected: {
      color: theme.colors.text.brand_primary,
    },
    // Products Section
    productsSection: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    productWrapper: {
      width: '50%',
      padding: 6,
    },
    productItem: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      overflow: 'hidden',
    },
    productImage: {
      width: '100%',
      aspectRatio: 1 / 0.825, // Match ProductCard: cardWidth / (cardHeight * 0.55) where cardHeight = cardWidth * 1.5
    },
    productInfo: {
      padding: 10,
    },
    productName: {
      fontSize: 13,
      color: theme.colors.text.primary,
      marginBottom: 4,
      minHeight: 36,
    },
    productPrice: {
      color: '#EF4444',
    },
    originalPriceRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      marginTop: 2,
    },
    originalPrice: {
      color: theme.colors.text.tertiary,
      textDecorationLine: 'line-through' as const,
    },
    discountPercent: {
      color: '#EF4444',
      fontSize: 11,
    },
    // Empty state
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.background.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    emptyDescription: {
      color: theme.colors.text.tertiary,
      textAlign: 'center',
    },
  });

export default Categories;
