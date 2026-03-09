import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, Dimensions } from 'react-native';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import type { FlashSale, ProductWithFlashSale, Product } from '@/types/database.types';

// Helper to format price to JPY
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(price);
};

interface FlashSaleSectionProps {
  flashSale: FlashSale;
  products: ProductWithFlashSale[];
  onViewAll?: () => void;
  onProductPress?: (product: Product) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.45;

const FlashSaleCard = ({
  item,
  onPress,
  theme,
  t,
}: {
  item: ProductWithFlashSale;
  onPress?: (product: Product) => void;
  theme: any;
  t: (key: string, params?: Record<string, string | number>) => string;
}) => {
  const originalPrice = item.base_price ?? 0;
  const flashSalePrice = item.flash_sale_price ?? item.sale_price ?? originalPrice;
  const discountPercent =
    originalPrice > 0 ? Math.round(((originalPrice - flashSalePrice) / originalPrice) * 100) : 0;

  // Mock sold count if not present (design shows "Đã bán 0/10")
  const sold = item.flash_sale_quantity_sold || 0;
  const limit = item.flash_sale_quantity_limit || 10;
  const percentSold = limit > 0 ? (sold / limit) * 100 : 0;

  return (
    <Pressable onPress={() => onPress?.(item)} style={styles.cardContainer}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.thumbnail_url ?? undefined }}
          style={styles.productImage}
          contentFit='cover'
        />
        <View style={styles.heartButton}>
          <Feather name='heart' size={16} color={theme.colors.text.secondary} />
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Price Section */}
        <View style={styles.priceRow}>
          {/* Left Price Part (Yellow) */}
          <View style={styles.priceLeft}>
            <Typography variant='text' size='sm' weight='bold' style={{ color: '#DC2626' }}>
              {formatPrice(flashSalePrice)}
            </Typography>
            <Typography
              variant='text'
              size='xs'
              style={{ color: '#6B7280', textDecorationLine: 'line-through', fontSize: 10 }}
            >
              {formatPrice(originalPrice)}
            </Typography>
          </View>

          {/* Divider (Lightning) */}
          <View style={styles.lightningDivider}>
            <Image
              source={require('@/assets/images/flash-2.png')}
              style={{ width: 24, height: '100%' }}
              contentFit='contain'
            />
          </View>

          {/* Right Discount Part (Red) */}
          <View style={styles.priceRight}>
            <Typography variant='text' size='xs' style={{ color: '#FFF' }}>
              {t('home.off')}
            </Typography>
            <Typography variant='text' size='md' weight='bold' style={{ color: '#FFF' }}>
              {discountPercent}%
            </Typography>
          </View>
        </View>

        {/* Sold Progress Bar */}
        <View style={styles.soldContainer}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.soldProgress, { width: `${Math.max(percentSold, 5)}%` }]} // Min width for visibility
          />
          <View style={styles.soldTextContainer}>
            <MaterialCommunityIcons
              name='fire'
              size={14}
              color={percentSold > 0 ? '#FFF' : '#F87171'}
            />
            <Typography
              variant='text'
              size='xs'
              style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}
            >
              {t('home.soldCount', { count: sold, limit })}
            </Typography>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({
  flashSale,
  products,
  onViewAll,
  onProductPress,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();

  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number }>({
    h: 0,
    m: 0,
    s: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(flashSale.end_time).getTime() - new Date().getTime();
      if (difference > 0) {
        return {
          h: Math.floor(difference / (1000 * 60 * 60)),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        };
      }
      return { h: 0, m: 0, s: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [flashSale.end_time]);

  if (products.length === 0) return null;

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <LinearGradient
      colors={['#EF4444', '#F59E0B']} // Red to Orange gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Typography variant='display' size='md' weight='bold' style={styles.title}>
            FLASH SALE
          </Typography>
          <Image
            source={require('@/assets/images/flash.png')}
            style={{ width: 20, height: 20, marginLeft: 8 }}
            contentFit='contain'
          />
        </View>

        <View style={styles.timerRow}>
          <Typography variant='text' size='xs' style={styles.endInText}>
            {t('home.endsIn')}
          </Typography>
          {/* Show Hours if > 0, otherwise standard M:S or H:M:S */}
          {timeLeft.h > 0 && (
            <>
              <View style={styles.timerBox}>
                <Typography variant='text' size='xs' weight='bold' style={styles.timerText}>
                  {formatTime(timeLeft.h)}
                </Typography>
              </View>
              <Typography variant='text' size='xs' weight='bold' style={styles.timerColon}>
                :
              </Typography>
            </>
          )}
          <View style={styles.timerBox}>
            <Typography variant='text' size='xs' weight='bold' style={styles.timerText}>
              {formatTime(timeLeft.m)}
            </Typography>
          </View>
          <Typography variant='text' size='xs' weight='bold' style={styles.timerColon}>
            :
          </Typography>
          <View style={styles.timerBox}>
            <Typography variant='text' size='xs' weight='bold' style={styles.timerText}>
              {formatTime(timeLeft.s)}
            </Typography>
          </View>
        </View>
      </View>

      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <FlashSaleCard item={item} onPress={onProductPress} theme={theme} t={t} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontStyle: 'italic',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  endInText: {
    color: '#FFF',
    marginRight: 4,
  },
  timerBox: {
    backgroundColor: '#FCD34D', // Yellow-400
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#000',
  },
  timerColon: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Card Styles
  cardContainer: {
    width: CARD_WIDTH,
    minWidth: 200,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 4,
  },
  cardContent: {
    gap: 8,
    padding: 8,
    paddingTop: 0,
  },
  priceRow: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f9e573f3', // Yellow background for left side
  },
  priceLeft: {
    flex: 3,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  lightningDivider: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginHorizontal: -8, // Overlap
  },
  priceRight: {
    flex: 2,
    backgroundColor: '#DC2626', // Red background
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  soldContainer: {
    height: 18,
    backgroundColor: '#FECACA', // Light red bg
    borderRadius: 9,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  soldProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  soldTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 4,
    paddingHorizontal: 4,
  },
});

export default FlashSaleSection;
