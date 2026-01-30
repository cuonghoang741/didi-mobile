import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
  Animated,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography, ProductCard, ProductReviews, CartIcon } from '@/components';
import { useTheme, useLanguage, useCart } from '@/contexts';
import { fetchProductDetail, fetchRelatedProducts, fetchProductsByIds } from '@/services/supabase';
import type { ProductDetail, ProductVariant, Product } from '@/types/database.types';
import { getLocalizedContent } from '@/utils/language';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useCurrency } from '@/hooks'; // Import hook

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const { formatPrice } = useCurrency(); // Hook usage
  const { width } = useWindowDimensions();
  const styles = createStyles(theme);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [buyAlongProducts, setBuyAlongProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageListRef = useRef<FlatList>(null);

  // Button animation states
  const [isAdded, setIsAdded] = useState(false);
  const addToCartScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const buttonColorAnim = useRef(new Animated.Value(0)).current;

  // Button press animation handlers
  const handlePressIn = useCallback(() => {
    Animated.spring(addToCartScale, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  }, [addToCartScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(addToCartScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [addToCartScale]);

  // Success animation when added to cart
  const playSuccessAnimation = useCallback(() => {
    setIsAdded(true);

    // Animate button color and icon
    Animated.parallel([
      // Bounce effect
      Animated.sequence([
        Animated.spring(addToCartScale, {
          toValue: 1.05,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(addToCartScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      // Success icon scale in
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      // Color transition
      Animated.timing(buttonColorAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();

    // Reset after 1.5 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(successScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonColorAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => setIsAdded(false));
    }, 1500);
  }, [addToCartScale, successScale, buttonColorAnim]);

  // ... (keep useEffect and handlers)

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      setLoading(true);
      const productData = await fetchProductDetail(id);
      setProduct(productData);

      if (productData?.product_variants && productData.product_variants.length > 0) {
        setSelectedVariant(productData.product_variants[0]);
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

      // Debug logging
      if (productData) {
        console.log('[ProductDetail] Loaded:', {
          name: productData.name,
          image_urls: productData.image_urls,
          thumbnail_url: productData.thumbnail_url,
          variants: productData.product_variants?.length || 0,
          variants_data: productData.product_variants,
        });
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || isAdded) return;
    addItem(product, selectedVariant, quantity);
    playSuccessAnimation();
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, selectedVariant, quantity);
    router.push('/cart');
  };

  const getCurrentPrice = (): number => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return product?.sale_price || product?.base_price || 0;
  };

  const getOriginalPrice = (): number | null => {
    if (selectedVariant) {
      // Variant only has price, no original distinction
      return null;
    }
    // If product has sale_price, base_price is the original
    if (product?.sale_price && product?.base_price && product.sale_price < product.base_price) {
      return product.base_price;
    }
    return null;
  };

  const currentPriceFormatted = formatPrice(getCurrentPrice());
  const originalPrice = getOriginalPrice();
  const originalPriceFormatted = originalPrice ? formatPrice(originalPrice) : null;

  // Build images array - handle various data shapes + variant images
  const images: string[] = React.useMemo(() => {
    const result: string[] = [];

    // Try image_urls first (array)
    if (product?.image_urls && Array.isArray(product.image_urls)) {
      result.push(...product.image_urls.filter(Boolean) as string[]);
    }

    // Fall back to thumbnail_url if no images
    if (result.length === 0 && product?.thumbnail_url) {
      result.push(product.thumbnail_url);
    }

    // Add variant images
    if (product?.product_variants && Array.isArray(product.product_variants)) {
      product.product_variants.forEach((variant: any) => {
        if (variant.image_url && !result.includes(variant.image_url)) {
          result.push(variant.image_url);
        }
      });
    }

    // Debug
    console.log('[ProductDetail] Images:', result);

    return result;
  }, [product]);

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
          <FontAwesome
            key={star}
            name={star <= rating ? 'star' : 'star-o'}
            size={16}
            color={star <= rating ? '#FFB800' : '#E5E7EB'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  // Interpolate button colors
  const buttonBorderColor = buttonColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.text.brand_primary, '#10B981'],
  });

  const buttonBgColor = buttonColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'rgba(16, 185, 129, 0.1)'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
        </Pressable>
        <CartIcon />
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
          {product.product_variants && product.product_variants.length > 0 && (
            <View style={styles.variantsSection}>
              <Typography variant='text' size='md' weight='semiBold' style={styles.sectionTitle}>
                {t('product.selectVariant')}
              </Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.variantsRow}>
                  {product.product_variants.map((variant: ProductVariant) => {
                    // Data is directly on variant object, not in options
                    const variantAny = variant as any;
                    const colorCode = variantAny.color_code;
                    const imageUrl = variantAny.image_url;
                    const variantName = variantAny.name || variantAny.color || variantAny.storage || variant.sku || 'Variant';

                    const isSelected = selectedVariant?.id === variant.id;

                    return (
                      <Pressable
                        key={variant.id}
                        style={[
                          styles.variantChip,
                          isSelected && styles.variantChipActive,
                        ]}
                        onPress={() => setSelectedVariant(variant)}
                      >
                        {/* Variant Image */}
                        {imageUrl && (
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.variantImage}
                            contentFit='cover'
                          />
                        )}

                        {/* Color dot with code */}
                        {colorCode && (
                          <View style={styles.colorInfo}>
                            <View style={[styles.colorDot, { backgroundColor: colorCode }]} />
                            <Typography
                              variant='text'
                              size='xs'
                              style={[styles.colorCode, isSelected && styles.colorCodeActive]}
                            >
                              {colorCode.toUpperCase()}
                            </Typography>
                          </View>
                        )}

                        {/* Variant Name */}
                        <Typography
                          variant='text'
                          size='sm'
                          weight={isSelected ? 'semiBold' : 'regular'}
                          style={[
                            styles.variantText,
                            isSelected && styles.variantTextActive,
                          ]}
                        >
                          {variantName}
                        </Typography>
                      </Pressable>
                    );
                  })}
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
            {product.description ? (
              <RenderHtml
                contentWidth={SCREEN_WIDTH - 32} // 16px padding on each side
                source={{
                  html: getLocalizedContent(
                    product.language,
                    'description',
                    language,
                    product.description || ''
                  ),
                }}
                tagsStyles={{
                  p: {
                    fontSize: 14,
                    color: theme.colors.text.secondary,
                    lineHeight: 22,
                    marginBottom: 8,
                  },
                  b: { fontWeight: 'bold' },
                  strong: { fontWeight: 'bold' },
                  h1: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
                  h2: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
                  h3: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
                  ul: { marginBottom: 8 },
                  li: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 4 },
                }}
              />
            ) : (
              <Typography variant='text' size='sm' style={styles.description}>
                Chưa có mô tả
              </Typography>
            )}
          </View>

          {/* Reviews */}
          <ProductReviews
            product={product}
            onViewAll={() => router.push(`/product/reviews/${id}`)}
          />

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
        <Animated.View
          style={{
            flex: 1,
            transform: [{ scale: addToCartScale }],
          }}
        >
          <Pressable
            onPress={handleAddToCart}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isAdded}
          >
            <Animated.View
              style={[
                styles.addToCartButton,
                {
                  borderColor: buttonBorderColor,
                  backgroundColor: buttonBgColor,
                },
              ]}
            >
              {isAdded ? (
                <Animated.View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    transform: [{ scale: successScale }],
                  }}
                >
                  <Feather name='check' size={20} color='#10B981' />
                  <Typography variant='text' size='md' weight='semiBold' style={{ color: '#10B981' }}>
                    {t('product.addedToCart') || 'Đã thêm!'}
                  </Typography>
                </Animated.View>
              ) : (
                <>
                  <Feather name='shopping-cart' size={20} color={theme.colors.text.brand_primary} />
                  <Typography variant='text' size='md' weight='semiBold' style={styles.addToCartText}>
                    {t('product.addToCart')}
                  </Typography>
                </>
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>
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
    variantImage: {
      width: 40,
      height: 40,
      borderRadius: 6,
      backgroundColor: theme.colors.background.secondary,
    },
    colorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    colorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    colorCode: {
      color: theme.colors.text.tertiary,
      fontSize: 10,
    },
    colorCodeActive: {
      color: theme.colors.text.brand_primary,
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
