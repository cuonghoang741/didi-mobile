import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';

import { Typography } from '@/components';
import { useTheme, useAuth } from '@/contexts';
import { useCurrency } from '@/hooks';
import { supabase } from '@/services/supabase';
import type { Product, ProductWithFlashSale } from '@/types/database.types';

const CARD_WIDTH = 150;
const CARD_HEIGHT = 200;

interface ProductCardProps {
  product: Product | ProductWithFlashSale;
  onPress?: (product: Product) => void;
  showFlashSalePrice?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, showFlashSalePrice }) => {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const { formatPrice } = useCurrency();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const flashSaleProduct = product as ProductWithFlashSale;
  const hasFlashSale = showFlashSalePrice && !!flashSaleProduct.flash_sale_price;

  // Use sale_price as the main price, fallback to base_price if sale_price is missing
  const currentPrice = hasFlashSale
    ? flashSaleProduct.flash_sale_price!
    : (product.sale_price || product.base_price || 0);

  // Use base_price as the original price
  const originalPrice = product.base_price || (hasFlashSale ? product.sale_price : null);

  const { jpy: displayJpy } = formatPrice(currentPrice);
  const originalPriceFormatted = originalPrice ? formatPrice(originalPrice) : null;

  const discountPercent = originalPrice && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

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
        await (supabase as any)
          .from('favorites')
          .insert({
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
          source={{ uri: product.thumbnail_url || product.image_urls?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.image}
          contentFit='cover'
          transition={200}
        />

        {/* Favorite Heart Button */}
        <Pressable
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleToggleFavorite();
          }}
          hitSlop={8}
        >
          {isToggling ? (
            <ActivityIndicator size='small' color='#EF4444' />
          ) : (
            <Feather
              name={isFavorite ? 'heart' : 'heart'}
              size={18}
              color={isFavorite ? '#EF4444' : '#9CA3AF'}
              style={isFavorite ? styles.heartFilled : undefined}
            />
          )}
        </Pressable>

        {discountPercent > 0 && !hasFlashSale && (
          <View style={styles.discountBadge}>
            <Typography variant='text' size='xs' weight='bold' style={styles.discountText}>
              -{discountPercent}%
            </Typography>
          </View>
        )}
        {hasFlashSale ? (
          <LinearGradient
            colors={['#FF6B6B', '#EE5A24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.flashSaleBadge}
          >
            <Typography variant='text' size='xs' weight='bold' style={styles.flashSaleText}>
              ⚡ SALE
            </Typography>
          </LinearGradient>
        ) : null}
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

          {(originalPriceFormatted && discountPercent > 0) ? (
            <View style={styles.originalPriceContainer}>
              <Typography variant='text' size='xs' style={styles.originalPrice}>
                {originalPriceFormatted.jpy}
              </Typography>
              <Typography variant='text' size='xs' weight='medium' style={styles.discountPercentText}>
                -{discountPercent}%
              </Typography>
            </View>
          ) : null}
        </View>

        {product.brand ? (
          <Typography variant='text' size='xs' style={styles.brand}>
            {product.brand}
          </Typography>
        ) : null}
      </View>
    </Pressable>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      width: CARD_WIDTH,
      backgroundColor: theme.colors.background.primary,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    imageContainer: {
      width: '100%',
      height: CARD_HEIGHT * 0.55,
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
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
      color: theme.colors.text.error_primary,
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
  });

export default ProductCard;

