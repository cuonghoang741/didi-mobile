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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { useCurrency } from '@/hooks';
import { fetchCategories, supabase } from '@/services/supabase';
import type { Category, Product } from '@/types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LEFT_PANEL_WIDTH = SCREEN_WIDTH * 0.3;
const RIGHT_PANEL_WIDTH = SCREEN_WIDTH * 0.7;

const Categories = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams();
  const styles = createStyles(theme);
  const { formatPrice } = useCurrency();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    loadCategories();
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
      // (avoid resetting user selection if id param didn't change but re-render happened? No, id comes from params)
      // Actually if user navigates to tab without params, id is undefined.
      if (!selectedCategory) {
        setSelectedCategory(categories[0]);
      }
    }
  }, [categories, id]);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory.id);
    }
  }, [selectedCategory]);

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

  const loadProducts = async (categoryId: string) => {
    setLoadingProducts(true);
    try {
      // Fetch subcategories first
      const { data: subCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryId)
        .is('deleted_at', null)
        .eq('is_active', true);

      const categoryIds = [categoryId, ...(subCategories?.map((c) => c.id) || [])];

      const { data } = await supabase
        .from('products')
        .select('*')
        .in('category_id', categoryIds)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategory?.id === item.id;
    return (
      <Pressable
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => setSelectedCategory(item)}
      >
        <Typography
          variant='text'
          size='sm'
          weight={isSelected ? 'bold' : 'regular'}
          style={[styles.categoryName, isSelected && styles.categoryNameSelected]}
        >
          {item.name}
        </Typography>
      </Pressable>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const { jpy } = formatPrice(item.sale_price || item.base_price || 0);
    return (
      <Pressable
        style={styles.productItem}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <Image
          source={{ uri: item.thumbnail_url || item.image_urls?.[0] || 'https://via.placeholder.com/100' }}
          style={styles.productImage}
          contentFit='cover'
        />
        <View style={styles.productInfo}>
          <Typography variant='text' size='sm' numberOfLines={2} style={styles.productName}>
            {item.name}
          </Typography>
          <Typography variant='text' size='sm' weight='bold' style={styles.productPrice}>
            {jpy}
          </Typography>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size='large' color={theme.colors.text.brand_primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Typography variant='display' size='sm' weight='bold'>
          {t('tabs.categories')}
        </Typography>
      </View>

      <View style={styles.content}>
        {/* Left Panel: Categories */}
        <View style={styles.leftPanel}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        {/* Right Panel: Products */}
        <View style={styles.rightPanel}>
          {selectedCategory && (
            <View style={styles.categoryHeader}>
              <Image
                source={{ uri: selectedCategory.image_url || 'https://via.placeholder.com/300x100' }}
                style={styles.categoryHeaderImage}
                contentFit='cover'
              />
              <View style={styles.categoryHeaderOverlay}>
                <Typography variant='text' size='md' weight='bold' style={styles.categoryHeaderTitle}>
                  {selectedCategory.name}
                </Typography>
              </View>
            </View>
          )}

          {loadingProducts ? (
            <View style={[styles.center, { flex: 1 }]}>
              <ActivityIndicator color={theme.colors.text.brand_primary} />
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.productList}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
            />
          )}
        </View>
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
    header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.secondary,
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
      width: RIGHT_PANEL_WIDTH,
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    categoryList: {
      paddingVertical: 0,
    },
    categoryItem: {
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.tertiary,
    },
    categoryItemSelected: {
      backgroundColor: theme.colors.background.primary,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.text.brand_primary,
    },
    categoryName: {
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
    categoryNameSelected: {
      color: theme.colors.text.brand_primary,
    },
    categoryHeader: {
      height: 100,
      width: '100%',
      position: 'relative',
    },
    categoryHeaderImage: {
      width: '100%',
      height: '100%',
    },
    categoryHeaderOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryHeaderTitle: {
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    productList: {
      padding: 12,
    },
    productItem: {
      flex: 1,
      marginBottom: 12,
      backgroundColor: theme.colors.background.primary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border.secondary,
      overflow: 'hidden',
    },
    productImage: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: theme.colors.background.secondary,
    },
    productInfo: {
      padding: 8,
    },
    productName: {
      fontSize: 12,
      color: theme.colors.text.primary,
      marginBottom: 4,
      height: 36,
    },
    productPrice: {
      color: theme.colors.text.error_primary,
      fontSize: 13,
    },
  });

export default Categories;
