import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography, ProductCard, ProductReviews } from '@/components';
import { useTheme, useLanguage, useCart } from '@/contexts';
import { fetchProductDetail, fetchRelatedProducts, fetchProductsByIds } from '@/services/supabase';
import type { ProductDetail, ProductVariant, Product } from '@/types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useCurrency } from '@/hooks'; // Import hook

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency(); // Hook usage
  const styles = createStyles(theme);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [buyAlongProducts, setBuyAlongProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageListRef = useRef<FlatList>(null);

  // ... (keep useEffect and handlers)

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      setLoading(true);
      const productData = await fetchProductDetail(id);
      setProduct(productData);

      if (productData?.variants && productData.variants.length > 0) {
        setSelectedVariant(productData.variants[0]);
      }

      const pDataAny = productData as any;
      const categoryId = productData?.category_id || pDataAny?.category_ids?.[0];

      if (categoryId) {
        const related = await fetchRelatedProducts(id, categoryId);
        setRelatedProducts(related);
      }

      // Fetch buy along products
      if (
        pDataAny?.related_ids &&
        Array.isArray(pDataAny.related_ids) &&
        pDataAny.related_ids.length > 0
      ) {
        const buyAlong = await fetchProductsByIds(pDataAny.related_ids);
        setBuyAlongProducts(buyAlong);
      }

      setLoading(false);
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, selectedVariant, quantity);
    // Show toast or feedback
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, selectedVariant, quantity);
    router.push('/cart');
  };

  const getCurrentPrice = (): number => {
    if (selectedVariant) {
      return selectedVariant.sale_price || selectedVariant.price;
    }
    return product?.price || 0;
  };

  const getOriginalPrice = (): number | null => {
    if (selectedVariant?.sale_price) {
      return selectedVariant.price;
    }
    return product?.compare_at_price || null;
  };

  const currentPriceFormatted = formatPrice(getCurrentPrice());
  const originalPrice = getOriginalPrice();
  const originalPriceFormatted = originalPrice ? formatPrice(originalPrice) : null;

  const images: string[] = product?.images
    ? ((Array.isArray(product.images) ? product.images : [product.image_url]).filter(
        Boolean,
      ) as string[])
    : product?.image_url
      ? [product.image_url]
      : [];

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size='large' color={theme.colors.text.brand_primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.center]}>
        <Typography variant='text' size='md'>
          {t('common.error')}
        </Typography>
      </View>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Feather
            key={star}
            name='star'
            size={16}
            color={star <= rating ? '#FFB800' : '#E5E7EB'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Pressable onPress={() => router.push('/cart')} style={styles.cartButton}>
          <Feather name='shopping-cart' size={24} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={imageListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.productImage} contentFit='cover' />
            )}
            keyExtractor={(_, index) => index.toString()}
          />
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor:
                        index === currentImageIndex ? theme.colors.text.brand_primary : '#E5E7EB',
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Typography variant='text' size='xl' weight='bold' style={styles.productName}>
            {product.name}
          </Typography>

          {/* Rating */}
          {product.avg_rating !== undefined && product.avg_rating > 0 && (
            <View style={styles.ratingRow}>
              {renderStars(Math.round(product.avg_rating))}
              <Typography variant='text' size='sm' style={styles.ratingText}>
                {product.avg_rating.toFixed(1)} ({product.review_count} {t('product.rating')})
              </Typography>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceContainer}>
            <View>
              <Typography variant='text' size='xl' weight='bold' style={styles.price}>
                {currentPriceFormatted.jpy}
              </Typography>
              <Typography
                variant='text'
                size='md'
                style={{ color: theme.colors.text.tertiary, marginTop: 4 }}
              >
                {currentPriceFormatted.vnd}
              </Typography>
            </View>
            {originalPriceFormatted && (
              <View style={{ justifyContent: 'center' }}>
                <Typography variant='text' size='md' style={styles.originalPrice}>
                  {originalPriceFormatted.jpy}
                </Typography>
              </View>
            )}
          </View>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <View style={styles.variantsSection}>
              <Typography variant='text' size='md' weight='semiBold' style={styles.sectionTitle}>
                {t('product.selectVariant')}
              </Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.variantsRow}>
                  {product.variants.map((variant) => (
                    <Pressable
                      key={variant.id}
                      style={[
                        styles.variantChip,
                        selectedVariant?.id === variant.id && styles.variantChipActive,
                      ]}
                      onPress={() => setSelectedVariant(variant)}
                    >
                      {variant.color_code && (
                        <View style={[styles.colorDot, { backgroundColor: variant.color_code }]} />
                      )}
                      <Typography
                        variant='text'
                        size='sm'
                        weight={selectedVariant?.id === variant.id ? 'semiBold' : 'regular'}
                        style={[
                          styles.variantText,
                          selectedVariant?.id === variant.id && styles.variantTextActive,
                        ]}
                      >
                        {variant.name || `${variant.color || ''} ${variant.storage || ''}`.trim()}
                      </Typography>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Typography variant='text' size='md' weight='semiBold'>
              {t('product.quantity')}
            </Typography>
            <View style={styles.quantityControls}>
              <Pressable
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Feather name='minus' size={18} color={theme.colors.text.primary} />
              </Pressable>
              <Typography variant='text' size='md' weight='semiBold' style={styles.quantityValue}>
                {quantity}
              </Typography>
              <Pressable style={styles.quantityButton} onPress={() => setQuantity(quantity + 1)}>
                <Feather name='plus' size={18} color={theme.colors.text.primary} />
              </Pressable>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Typography variant='text' size='md' weight='semiBold' style={styles.sectionTitle}>
              {t('product.description')}
            </Typography>
            <Typography variant='text' size='sm' style={styles.description}>
              {product.description || 'Chưa có mô tả'}
            </Typography>
          </View>

          {/* Reviews */}
          <ProductReviews product={product} />

          {/* Buy Along Products */}
          {buyAlongProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Typography variant='text' size='md' weight='semiBold' style={styles.sectionTitle}>
                {t('product.buyAlong')}
              </Typography>
              <FlatList
                data={buyAlongProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
                )}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                keyExtractor={(item) => item.id}
              />
            </View>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Typography variant='text' size='md' weight='semiBold' style={styles.sectionTitle}>
                {t('product.relatedProducts')}
              </Typography>
              <FlatList
                data={relatedProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
                )}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                keyExtractor={(item) => item.id}
              />
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.addToCartButton} onPress={handleAddToCart}>
          <Feather name='shopping-cart' size={20} color={theme.colors.text.brand_primary} />
          <Typography variant='text' size='md' weight='semiBold' style={styles.addToCartText}>
            {t('product.addToCart')}
          </Typography>
        </Pressable>
        <Pressable style={styles.buyNowButton} onPress={handleBuyNow}>
          <LinearGradient
            colors={['#5B7CFF', '#3D4DF4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyNowGradient}
          >
            <Typography variant='text' size='md' weight='bold' style={styles.buyNowText}>
              {t('product.buyNow')}
            </Typography>
          </LinearGradient>
        </Pressable>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 8,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 20,
    },
    cartButton: {
      padding: 8,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 20,
    },
    imageContainer: {
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH,
      backgroundColor: theme.colors.background.secondary,
    },
    productImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH,
    },
    pagination: {
      position: 'absolute',
      bottom: 16,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    infoContainer: {
      padding: 16,
    },
    productName: {
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    starsContainer: {
      flexDirection: 'row',
    },
    ratingText: {
      marginLeft: 8,
      color: theme.colors.text.secondary,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    price: {
      color: theme.colors.text.brand_primary,
    },
    originalPrice: {
      color: theme.colors.text.tertiary,
      textDecorationLine: 'line-through',
    },
    variantsSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    variantsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    variantChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: theme.colors.background.primary,
      gap: 8,
    },
    variantChipActive: {
      borderColor: theme.colors.text.brand_primary,
      backgroundColor: '#EEF2FF',
    },
    colorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    variantText: {
      color: theme.colors.text.secondary,
    },
    variantTextActive: {
      color: theme.colors.text.brand_primary,
    },
    quantitySection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    quantityButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.colors.background.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityValue: {
      minWidth: 30,
      textAlign: 'center',
    },
    descriptionSection: {
      marginBottom: 24,
    },
    description: {
      color: theme.colors.text.secondary,
      lineHeight: 22,
    },

    relatedSection: {
      marginBottom: 24,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      padding: 16,
      paddingBottom: 32,
      backgroundColor: theme.colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      gap: 12,
    },
    addToCartButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.text.brand_primary,
      gap: 8,
    },
    addToCartText: {
      color: theme.colors.text.brand_primary,
    },
    buyNowButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    buyNowGradient: {
      paddingVertical: 14,
      alignItems: 'center',
    },
    buyNowText: {
      color: '#FFFFFF',
    },
  });

export default ProductDetailScreen;
