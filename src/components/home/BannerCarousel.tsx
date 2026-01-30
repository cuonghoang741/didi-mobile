import { Image } from 'expo-image';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography } from '@/components';
import { useTheme } from '@/contexts';
import type { Banner } from '@/types/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 180;
const BANNER_MARGIN = 16;
const BANNER_GAP = 12;
const BANNER_WIDTH = SCREEN_WIDTH - BANNER_MARGIN * 2;

interface BannerCarouselProps {
  banners: Banner[];
  onBannerPress?: (banner: Banner) => void;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, onBannerPress }) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (banners.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000);
  }, [banners.length]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
  }, [startAutoPlay, stopAutoPlay]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (BANNER_WIDTH + BANNER_GAP));
    setCurrentIndex(index);
  };

  const handleBannerPress = (banner: Banner) => {
    onBannerPress?.(banner);
  };

  const renderBanner = ({ item }: { item: Banner }) => (
    <Pressable
      onPress={() => handleBannerPress(item)}
      onPressIn={stopAutoPlay}
      onPressOut={startAutoPlay}
      style={styles.bannerContainer}
    >
      <Image
        source={{ uri: item.mobile_image_url || item.image_url }}
        style={styles.bannerImage}
        contentFit='cover'
        transition={300}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.gradient}>
        <View style={styles.textContainer}>
          {item.subtitle ? (
            <Typography variant='text' size='sm' style={styles.subtitle}>
              {item.subtitle}
            </Typography>
          ) : null}
          <Typography variant='text' size='xl' weight='bold' style={styles.title}>
            {item.title}
          </Typography>
          {item.button_text ? (
            <View style={styles.buttonContainer}>
              <Typography variant='text' size='sm' weight='semiBold' style={styles.buttonText}>
                {item.button_text}
              </Typography>
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        snapToInterval={BANNER_WIDTH + BANNER_GAP}
        decelerationRate='fast'
        ItemSeparatorComponent={() => <View style={{ width: BANNER_GAP }} />}
        getItemLayout={(_, index) => ({
          length: BANNER_WIDTH + BANNER_GAP,
          offset: (BANNER_WIDTH + BANNER_GAP) * index,
          index,
        })}
      />

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? theme.colors.text.brand_primary
                      : theme.colors.background.secondary,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: BANNER_MARGIN,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  textContainer: {
    gap: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
});

export default BannerCarousel;
