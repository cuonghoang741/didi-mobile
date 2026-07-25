import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';

import { Typography, Button } from '@/components';
import { useTheme, useAuth, useLanguage } from '@/contexts';
import { useCurrency } from '@/hooks';
import { supabase } from '@/services/supabase';
import type { Product, ProductWithFlashSale } from '@/types/database.types';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react-native';

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;
const CARD_HEIGHT = CARD_WIDTH * 1.5; // Maintain ~2:3 aspect ratio (150/225 or similar)

interface ProductCardProps {
  product: Product | ProductWithFlashSale;
  onPress?: (product: Product) => void;
  showFlashSalePrice?: boolean;
  showHotBadge?: boolean;
  width?: number; // Optional custom width for the card
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  showFlashSalePrice,
  showHotBadge,
  width,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const cardWidth = width || CARD_WIDTH;
  const cardHeight = cardWidth * 1.5;
  const styles = createStyles(theme, cardWidth, cardHeight);
  const { formatPrice } = useCurrency();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const flashSaleProduct = product as ProductWithFlashSale;
  const hasFlashSale = showFlashSalePrice && !!flashSaleProduct.flash_sale_price;

  // Use sale_price as the main price, fallback to base_price if sale_price is missing
  const currentPrice = hasFlashSale
    ? flashSaleProduct.flash_sale_price!
    : product.sale_price || product.base_price || 0;

  // Use base_price as the original price
  const originalPrice = product.base_price || (hasFlashSale ? product.sale_price : null);

  const { jpy: displayJpy } = formatPrice(currentPrice);
  const originalPriceFormatted = originalPrice ? formatPrice(originalPrice) : null;

  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  // Out of stock when inventory is tracked and depleted
  const isOutOfStock = product.stock_quantity != null && product.stock_quantity <= 0;

  // Check if product is in favorites
  useEffect(() => {
    if (!user) {
      setIsFavorite(false);
      return;
    }

    const checkFavorite = async () => {
      const { data } = await (supabase as any)
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      setIsFavorite(!!data);
    };

    checkFavorite();
  }, [user, product.id]);

  const handleToggleFavorite = async () => {
    // If not logged in, redirect to signin
    if (!user) {
      router.push('/signin');
      return;
    }

    if (isToggling) return;
    setIsToggling(true);

    try {
      if (isFavorite) {
        // Remove from favorites
        await (supabase as any)
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        setIsFavorite(false);
      } else {
        // Add to favorites
        await (supabase as any).from('favorites').insert({
          user_id: user.id,
          product_id: product.id,
        });

        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Pressable
      onPress={() => onPress?.(product)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              product.thumbnail_url || product.image_urls?.[0] || 'https://via.placeholder.com/150',
          }}
          style={styles.image}
          contentFit='cover'
          transition={200}
        />

        {/* Favorite Heart Button */}
        <View style={styles.favoriteButton}>
          <Button
            variant='liquid'
            size='sm'
            isIconOnly
            startIcon={isFavorite ? IconHeartFilled : IconHeart}
            startIconSize={16}
            startIconColor={isFavorite ? '#EF4444' : '#9CA3AF'}
            onPress={handleToggleFavorite}
            loading={isToggling}
            tintColor='rgba(255, 255, 255, 0.9)'
          />
        </View>

        {showHotBadge && (
          <LinearGradient
            colors={['#FF6B6B', '#EE5A24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.discountBadge}
          >
            <Typography variant='text' size='xs' weight='bold' style={styles.discountText}>
              HOT
            </Typography>
          </LinearGradient>
        )}
        {hasFlashSale && !isOutOfStock ? (
          <LinearGradient
            colors={['#FF6B6B', '#EE5A24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.flashSaleBadge}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Image
                source={require('@/assets/images/flash.png')}
                style={{ width: 14, height: 14 }}
                contentFit='contain'
              />
              <Typography variant='text' size='xs' weight='bold' style={styles.flashSaleText}>
                SALE
              </Typography>
            </View>
          </LinearGradient>
        ) : null}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <View style={styles.outOfStockBand}>
              <Typography
                variant='text'
                size='md'
                weight='bold'
                style={styles.outOfStockText}
                numberOfLines={1}
              >
                {(t('product.outOfStock') || 'Hết hàng').toUpperCase()}
              </Typography>
            </View>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Typography
          variant='text'
          size='sm'
          weight='medium'
          numberOfLines={2}
          style={styles.productName}
        >
          {product.name}
        </Typography>

        <View style={styles.priceWrapper}>
          <Typography variant='text' size='md' weight='bold' style={styles.price}>
            {displayJpy}
          </Typography>

          {originalPriceFormatted && discountPercent > 0 ? (
            <View style={styles.originalPriceContainer}>
              <Typography variant='text' size='xs' style={styles.originalPrice}>
                {originalPriceFormatted.jpy}
              </Typography>
              <Typography
                variant='text'
                size='xs'
                weight='medium'
                style={styles.discountPercentText}
              >
                -{discountPercent}%
              </Typography>
            </View>
          ) : null}
        </View>

        {/* Rating Section - moved to bottom */}
        {product.rating_average ? (
          <View style={styles.ratingContainer}>
            <FontAwesome5 name='star' solid size={12} color='#F59E0B' style={styles.starIcon} />
            <Typography variant='text' size='xs' style={styles.ratingText}>
              {product.rating_average.toFixed(1)}
            </Typography>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>, cardWidth: number, cardHeight: number) =>
  StyleSheet.create({
    container: {
      width: cardWidth,
      backgroundColor: 'white',
      borderRadius: 12,
      overflow: 'hidden',
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    imageContainer: {
      width: '100%',
      height: cardHeight * 0.55,
      backgroundColor: theme.colors.background.secondary,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    favoriteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      borderRadius: 16,
      opacity: 0.9,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    heartFilled: {
      // For filled heart effect - Feather doesn't have filled, so we simulate with color
    },
    discountBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: '#FF6B6B',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    discountText: {
      color: '#FFFFFF',
    },
    flashSaleBadge: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: 4,
      alignItems: 'center',
    },
    flashSaleText: {
      color: '#FFFFFF',
    },
    outOfStockOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    outOfStockBand: {
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      paddingVertical: 8,
      alignItems: 'center',
    },
    outOfStockText: {
      color: '#4B5563',
      letterSpacing: 1,
    },
    infoContainer: {
      padding: 10,
      flex: 1,
      justifyContent: 'space-between',
    },
    productName: {
      color: theme.colors.text.primary,
      lineHeight: 18,
      marginBottom: 8,
    },
    priceWrapper: {
      gap: 2,
    },
    price: {
      color: theme.colors.text.price,
      fontSize: 16,
    },
    originalPriceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    originalPrice: {
      color: theme.colors.text.tertiary,
      textDecorationLine: 'line-through',
    },
    discountPercentText: {
      color: theme.colors.text.error_primary,
    },
    brand: {
      color: theme.colors.text.secondary,
      marginTop: 4,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 4,
      gap: 4,
    },
    starIcon: {
      marginTop: -1, // Visual alignment
    },
    ratingText: {
      color: theme.colors.text.secondary,
      lineHeight: 14,
    },
  });

export default ProductCard;
