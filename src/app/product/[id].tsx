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
import { useTheme, useLanguage, useCart, useAuth } from '@/contexts';
import { fetchProductDetail, fetchRelatedProducts, fetchProductsByIds } from '@/services/supabase';
import type { ProductDetail, ProductVariant, Product } from '@/types/database.types';
import { getLocalizedContent } from '@/utils/language';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Map common color names to hex codes
const colorNameToHex = (colorName: string | null | undefined): string | null => {
  if (!colorName) return null;

  const normalizedName = colorName.toLowerCase().trim();

  // Common color mappings
  const colorMap: Record<string, string> = {
    // Blacks
    black: '#1A1A1A',
    'titanium black': '#2D2D2D',
    midnight: '#1C1C1E',
    graphite: '#41464B',

    // Grays
    gray: '#808080',
    grey: '#808080',
    'titanium gray': '#8E8E93',
    'titanium grey': '#8E8E93',
    silver: '#C0C0C0',
    'space gray': '#535150',

    // Whites
    white: '#FFFFFF',
    cream: '#FFFDD0',
    pearl: '#F5F5F5',

    // Violets/Purples
    violet: '#8B5CF6',
    'titanium violet': '#9B7EDE',
    purple: '#9333EA',
    lavender: '#E6E6FA',

    // Blues
    blue: '#3B82F6',
    'titanium blue': '#5B7FDE',
    navy: '#1E3A5F',
    'sky blue': '#87CEEB',
    'pacific blue': '#1E88E5',

    // Greens
    green: '#22C55E',
    'alpine green': '#4A5D23',
    mint: '#98FB98',

    // Reds/Pinks
    red: '#EF4444',
    pink: '#EC4899',
    rose: '#F43F5E',
    coral: '#FF7F50',

    // Yellows/Golds
    yellow: '#EAB308',
    gold: '#FFD700',
    'titanium gold': '#C7A958',

    // Browns
    brown: '#92400E',
    bronze: '#CD7F32',

    // Others
    natural: '#F5F5DC',
    titanium: '#878681',
  };

  // Try exact match first
  if (colorMap[normalizedName]) {
    return colorMap[normalizedName];
  }

  // Try partial match
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }

  return null;
};

import { useCurrency } from '@/hooks'; // Import hook

const ProductDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const { user } = useAuth();
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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionNeedsExpand, setDescriptionNeedsExpand] = useState(false);
  const imageListRef = useRef<FlatList>(null);
  const thumbnailListRef = useRef<FlatList>(null);

  // Button animation states
  const [isAdded, setIsAdded] = useState(false);

  // Simple success animation - just swap icon for a moment
  const playSuccessAnimation = useCallback(() => {
    setIsAdded(true);
    // Reset after 1.5 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  }, []);

  // Warranty Animation
  const warrantyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (product) {
      Animated.timing(warrantyAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [product]);

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
    if (!user) {
      router.push('/signin');
      return;
    }
    if (!product || isAdded) return;
    addItem(product, selectedVariant, quantity);
    playSuccessAnimation();
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push('/signin');
      return;
    }
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
      result.push(...(product.image_urls.filter(Boolean) as string[]));
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

  // Sync thumbnail scroll
  useEffect(() => {
    if (images.length > 1 && thumbnailListRef.current) {
      try {
        thumbnailListRef.current.scrollToIndex({
          index: currentImageIndex,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (e) {
        // Ignore error when list is not yet measured
      }
    }
  }, [currentImageIndex, images.length]);

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
        </View>

        {/* Thumbnails */}
        {images.length > 1 && (
          <FlatList
            ref={thumbnailListRef}
            data={images}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailList}
            contentContainerStyle={styles.thumbnailListContent}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => {
                  setCurrentImageIndex(index);
                  imageListRef.current?.scrollToOffset({
                    offset: index * SCREEN_WIDTH,
                    animated: true,
                  });
                }}
                style={[
                  styles.thumbnailItem,
                  currentImageIndex === index && styles.thumbnailItemActive,
                ]}
              >
                <Image source={{ uri: item }} style={styles.thumbnailImage} contentFit='cover' />
              </Pressable>
            )}
            keyExtractor={(_, index) => index.toString()}
          />
        )}

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

          {/* Variants - Color Selection */}
          {product.product_variants &&
            product.product_variants.length > 0 &&
            (() => {
              // Check if all variants are color-only (no images)
              const allColorOnly = product.product_variants.every((v: any) => !v.image_url);

              return (
                <View style={styles.variantsSection}>
                  <Typography variant='text' size='md' style={styles.variantHeaderText}>
                    <Typography variant='text' size='md' weight='medium'>
                      {t('product.selectColor')}:{' '}
                    </Typography>
                    <Typography variant='text' size='md' style={styles.selectedColorName}>
                      {(() => {
                        const v = selectedVariant as any;
                        return v?.name || v?.color || t('product.notSelected');
                      })()}
                    </Typography>
                  </Typography>
                  <View style={[styles.variantsGrid, allColorOnly && styles.variantsGridSmall]}>
                    {product.product_variants.map((variant: ProductVariant) => {
                      const variantAny = variant as any;
                      const imageUrl = variantAny.image_url;
                      // Try color_code first, then convert color name to hex
                      const colorHex =
                        variantAny.color_code ||
                        variantAny.hex_color ||
                        colorNameToHex(variantAny.color);
                      const isSelected = selectedVariant?.id === variant.id;

                      return (
                        <Pressable
                          key={variant.id}
                          style={[
                            allColorOnly ? styles.colorSwatchCard : styles.variantCard,
                            isSelected &&
                              (allColorOnly
                                ? styles.colorSwatchCardActive
                                : styles.variantCardActive),
                          ]}
                          onPress={() => setSelectedVariant(variant)}
                        >
                          {imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.variantCardImage}
                              contentFit='cover'
                            />
                          ) : colorHex ? (
                            <View
                              style={[
                                allColorOnly ? styles.colorSwatchInner : styles.variantCardImage,
                                { backgroundColor: colorHex },
                              ]}
                            />
                          ) : (
                            <Image
                              source={{
                                uri:
                                  product.thumbnail_url ||
                                  (product.image_urls && product.image_urls[0]),
                              }}
                              style={styles.variantCardImage}
                              contentFit='cover'
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })()}

          {/* Warranty Section */}
          {(() => {
            const warrantyText = getLocalizedContent(product.language, 'warranty', language, '');
            if (!warrantyText) return null;

            return (
              <Animated.View
                style={[
                  styles.warrantySection,
                  {
                    opacity: warrantyAnim,
                    transform: [
                      {
                        translateY: warrantyAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.warrantyHeader}>
                  <Feather name='shield' size={20} color={theme.colors.text.brand_primary} />
                  <Typography
                    variant='text'
                    size='md'
                    weight='semiBold'
                    style={styles.warrantyTitle}
                  >
                    {t('product.warranty')}
                  </Typography>
                </View>
                <RenderHtml
                  contentWidth={SCREEN_WIDTH - 64}
                  source={{
                    html: warrantyText,
                  }}
                  tagsStyles={{
                    p: {
                      fontSize: 14,
                      color: theme.colors.text.secondary,
                      lineHeight: 20,
                      marginBottom: 8,
                    },
                    b: { fontWeight: 'bold' },
                    strong: { fontWeight: 'bold' },
                    ul: { marginBottom: 8 },
                    li: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 4 },
                  }}
                />
              </Animated.View>
            );
          })()}

          {/* Description */}
          {(() => {
            const descriptionHtml = getLocalizedContent(
              product.language,
              'description',
              language,
              product.description || '',
            );
            if (!descriptionHtml) return null;
            return (
              <View style={styles.descriptionSection}>
                <Typography variant='text' size='md' weight='semiBold' style={styles.sectionTitle}>
                  {t('product.description')}
                </Typography>
                <View>
                  <View
                    style={[
                      styles.descriptionContent,
                      !descriptionExpanded && descriptionNeedsExpand && styles.descriptionCollapsed,
                    ]}
                    onLayout={(e) => {
                      if (!descriptionNeedsExpand && !descriptionExpanded) {
                        const { height } = e.nativeEvent.layout;
                        if (height >= 150) {
                          setDescriptionNeedsExpand(true);
                        }
                      }
                    }}
                  >
                    <RenderHtml
                      contentWidth={SCREEN_WIDTH - 64}
                      source={{
                        html: descriptionHtml,
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
                  </View>
                  {descriptionNeedsExpand && !descriptionExpanded && (
                    <LinearGradient
                      colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#FFFFFF']}
                      style={styles.descriptionOverlay}
                    />
                  )}
                  {descriptionNeedsExpand && (
                    <Pressable
                      style={styles.viewMoreButton}
                      onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                    >
                      <Typography
                        variant='text'
                        size='sm'
                        weight='semiBold'
                        style={styles.viewMoreText}
                      >
                        {descriptionExpanded ? t('product.collapse') : t('product.viewMore')}
                      </Typography>
                      <Feather
                        name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={theme.colors.text.brand_primary}
                      />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })()}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <View style={styles.specificationsSection}>
              <Typography variant='text' size='md' weight='semiBold' style={styles.sectionTitle}>
                {t('product.specifications') || 'Thông số kỹ thuật'}
              </Typography>
              <View style={styles.specsContainer}>
                {Object.entries(product.specifications as Record<string, string | number>).map(
                  ([key, value]) => (
                    <View key={key} style={styles.specRow}>
                      <Typography variant='text' size='sm' style={styles.specKey}>
                        {t(`product.specs.${key}`) !== `product.specs.${key}`
                          ? t(`product.specs.${key}`)
                          : key
                              .replace(/_/g, ' ')
                              .replace(/([A-Z])/g, ' $1') // CamelCase to spaced
                              .toUpperCase()
                              .trim()}
                      </Typography>
                      <Typography
                        variant='text'
                        size='sm'
                        weight='semiBold'
                        style={styles.specValue}
                      >
                        {String(value)}
                      </Typography>
                    </View>
                  ),
                )}
              </View>
            </View>
          )}

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
        <Pressable
          style={[styles.addToCartButton, isAdded && styles.addToCartButtonSuccess]}
          onPress={handleAddToCart}
          disabled={isAdded}
        >
          <View style={styles.addToCartContent}>
            {isAdded ? (
              <Feather name='check' size={20} color='#10B981' />
            ) : (
              <Feather name='shopping-cart' size={20} color={theme.colors.text.primary} />
            )}
            <Typography
              variant='text'
              size='md'
              weight='semiBold'
              style={isAdded ? styles.addToCartTextSuccess : styles.addToCartText}
            >
              {t('product.addToCart')}
            </Typography>
          </View>
        </Pressable>
        <Pressable
          style={[styles.buyNowButton, { backgroundColor: '#2E8FF9' }]}
          onPress={handleBuyNow}
        >
          <View style={styles.buyNowGradient}>
            <Typography variant='text' size='md' weight='bold' style={styles.buyNowText}>
              {t('product.buyNow')}
            </Typography>
          </View>
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
      width: '100%',
      aspectRatio: 1, // Keep square aspect ratio
      backgroundColor: theme.colors.background.secondary,
    },
    productImage: {
      width: SCREEN_WIDTH,
      aspectRatio: 1,
    },
    thumbnailList: {
      marginTop: 12,
      maxHeight: 70,
    },
    thumbnailListContent: {
      gap: 12,
      paddingHorizontal: 16,
    },
    thumbnailItem: {
      width: 60,
      height: 60,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
      overflow: 'hidden',
      backgroundColor: theme.colors.background.secondary,
    },
    thumbnailItemActive: {
      borderColor: theme.colors.text.brand_primary,
      borderWidth: 2,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
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
      color: theme.colors.text.error_primary,
    },
    originalPrice: {
      color: theme.colors.text.tertiary,
      textDecorationLine: 'line-through',
    },
    variantsSection: {
      marginBottom: 20,
    },
    variantHeaderText: {
      marginBottom: 12,
    },
    variantLabel: {
      color: theme.colors.text.primary,
    },
    selectedColorName: {
      color: theme.colors.text.secondary,
    },
    variantsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    variantCard: {
      width: 60,
      height: 60,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      overflow: 'hidden',
    },
    variantCardActive: {
      borderColor: theme.colors.text.brand_primary,
    },
    variantCardImage: {
      width: '100%',
      height: '100%',
    },
    variantCardPlaceholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
    },
    // Small color swatches for color-only variants
    variantsGridSmall: {
      gap: 10,
    },
    warrantySection: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: 'rgba(59, 130, 246, 0.1)', // Light blue tint
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.text.brand_primary,
      // Shadow
      shadowColor: theme.colors.text.brand_primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    warrantyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    warrantyTitle: {
      marginLeft: 8,
      color: theme.colors.text.brand_primary,
    },
    warrantyContent: {
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    colorSwatchCard: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      overflow: 'hidden',
      padding: 2,
    },
    colorSwatchCardActive: {
      borderColor: theme.colors.text.brand_primary,
    },
    colorSwatchInner: {
      width: '100%',
      height: '100%',
      borderRadius: 18,
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
      backgroundColor: '#FFFFFF',
      padding: 16,
      borderRadius: 12,
    },
    descriptionContent: {
      overflow: 'hidden',
    },
    descriptionCollapsed: {
      maxHeight: 150,
    },
    descriptionOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
    },
    viewMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 12,
      gap: 4,
    },
    viewMoreText: {
      color: theme.colors.text.brand_primary,
    },
    description: {
      color: theme.colors.text.secondary,
      lineHeight: 22,
    },
    specificationsSection: {
      marginBottom: 24,
      backgroundColor: '#FFFFFF',
      padding: 16,
      borderRadius: 12,
    },
    specsContainer: {
      marginTop: 8,
    },
    specRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      backgroundColor: 'transparent',
    },
    specKey: {
      color: theme.colors.text.secondary,
      flex: 1,
    },
    specValue: {
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: 'right',
    },
    // Removed imageCounter styles

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
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
    },
    addToCartButtonSuccess: {
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    addToCartContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    addToCartText: {
      color: theme.colors.text.primary,
    },
    addToCartTextSuccess: {
      color: '#10B981',
    },
    buyNowButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buyNowGradient: {
      width: '100%',
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buyNowText: {
      color: '#FFFFFF',
    },
  });

export default ProductDetailScreen;
