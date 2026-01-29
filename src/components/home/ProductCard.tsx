import { Image } from 'expo-image';
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography } from '@/components';
import { useTheme } from '@/contexts';
import { useCurrency } from '@/hooks';
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
  const styles = createStyles(theme);
  const { formatPrice } = useCurrency(); // Import useCurrency

  const flashSaleProduct = product as ProductWithFlashSale;
  const hasFlashSale = showFlashSalePrice && flashSaleProduct.flash_sale_price;
  const displayPrice = hasFlashSale ? flashSaleProduct.flash_sale_price! : product.price;
  const originalPrice = product.compare_at_price || (hasFlashSale ? product.price : null);

  const { jpy: displayJpy, vnd: displayVnd } = formatPrice(displayPrice);
  const originalPriceFormatted = originalPrice ? formatPrice(originalPrice) : null;

  const discountPercent = originalPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  return (
    <Pressable
      onPress={() => onPress?.(product)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
          style={styles.image}
          contentFit='cover'
          transition={200}
        />
        {discountPercent > 0 && (
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

        <View style={styles.priceContainer}>
          <View>
            <Typography variant='text' size='md' weight='bold' style={styles.price}>
              {displayJpy}
            </Typography>
            <Typography
              variant='text'
              size='xs'
              style={{ color: theme.colors.text.tertiary, marginTop: 2 }}
            >
              {displayVnd}
            </Typography>
          </View>

          {originalPriceFormatted ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Typography variant='text' size='xs' style={styles.originalPrice}>
                {originalPriceFormatted.jpy}
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
    discountBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
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
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    price: {
      color: theme.colors.text.brand_primary,
    },
    originalPrice: {
      color: theme.colors.text.tertiary,
      textDecorationLine: 'line-through',
    },
    brand: {
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
  });

export default ProductCard;
