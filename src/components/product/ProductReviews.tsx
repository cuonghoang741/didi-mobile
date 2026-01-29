import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';

import Typography from '../ui/Typography/Typography';
import { useTheme } from '@/contexts';
import { useLanguage } from '@/contexts';
import type { ProductDetail } from '@/types/database.types';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface ProductReviewsProps {
  product: ProductDetail;
  onViewAll?: () => void;
}

const ProductReviews = ({ product, onViewAll }: ProductReviewsProps) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const reviews = product.reviews || [];
  const avgRating = product.avg_rating || 0;
  const totalReviews = product.review_count || 0;

  // Calculate rating distribution from available reviews
  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviews.length > 0) {
      reviews.forEach((r) => {
        const rating = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
        if (rating >= 1 && rating <= 5) {
          counts[rating] = (counts[rating] || 0) + 1;
        }
      });
    }
    return counts;
  }, [reviews]);

  const totalCalculated = Object.values(ratingCounts).reduce((a, b) => a + b, 0);

  const renderStars = (rating: number, size = 14) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Feather
            key={star}
            name='star'
            size={size}
            color={star <= rating ? '#FFB800' : '#E5E7EB'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant='text' size='lg' weight='bold'>
          Đánh giá sản phẩm
        </Typography>
        <Pressable onPress={onViewAll} style={styles.viewAllBtn}>
          <Typography variant='text' size='md' style={styles.viewAllText}>
            Xem tất cả
          </Typography>
          <Feather name='chevron-right' size={20} color='#3B82F6' />
        </Pressable>
      </View>

      <View style={styles.summaryContainer}>
        {/* Left: Overall Rating */}
        <View style={styles.summaryLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
            <Typography variant='text' size='3xl' weight='bold' style={styles.avgRatingText}>
              {avgRating.toFixed(1)}
            </Typography>
          </View>
          <View style={{ marginBottom: 6 }}>{renderStars(Math.round(avgRating), 16)}</View>
          <Typography variant='text' size='sm' style={styles.totalReviewsText}>
            {totalReviews} đánh giá
          </Typography>
        </View>

        {/* Right: Progress Bars */}
        <View style={styles.summaryRight}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
            const percentage = totalCalculated > 0 ? (count / totalCalculated) * 100 : 0;
            return (
              <View key={star} style={styles.ratingBarRow}>
                <Typography variant='text' size='xs' weight='medium' style={styles.starLabel}>
                  {star}
                </Typography>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Reviews List */}
      <View style={styles.reviewList}>
        {reviews.length > 0 ? (
          reviews.slice(0, 3).map((review) => {
            const images = Array.isArray(review.images)
              ? review.images
              : review.images
                ? [review.images]
                : [];
            const imageUrls = (images as any[]).filter((img) => typeof img === 'string');

            return (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatar}>
                    {review.user?.avatar_url ? (
                      <Image source={{ uri: review.user.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <Typography variant='text' size='md' weight='bold' style={styles.avatarText}>
                        {(review.user?.full_name || 'U').charAt(0).toUpperCase()}
                      </Typography>
                    )}
                  </View>
                  <View style={styles.reviewInfo}>
                    <Typography variant='text' size='md' weight='bold'>
                      {review.user?.full_name || 'Người dùng'}
                    </Typography>
                    <View style={styles.reviewMeta}>
                      {renderStars(review.rating, 12)}
                      <Typography variant='text' size='xs' style={styles.metaDot}>
                        •
                      </Typography>
                      <Typography variant='text' size='xs' style={styles.timeText}>
                        {dayjs(review.created_at).fromNow()}
                      </Typography>
                    </View>
                  </View>
                  <Pressable style={{ padding: 4 }}>
                    <Feather name='more-vertical' size={20} color='#9CA3AF' />
                  </Pressable>
                </View>

                <Typography variant='text' size='md' style={styles.comment}>
                  {review.comment}
                </Typography>

                {imageUrls.length > 0 && (
                  <View style={styles.reviewImages}>
                    {imageUrls.map((img, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: img }}
                        style={styles.reviewImage}
                        contentFit='cover'
                      />
                    ))}
                  </View>
                )}

                <Typography variant='text' size='xs' style={styles.absoluteTime}>
                  {dayjs(review.created_at).format('D/M/YYYY HH:mm')}
                </Typography>
              </View>
            );
          })
        ) : (
          <Typography variant='text' size='sm' style={styles.noReviews}>
            Chưa có đánh giá nào.
          </Typography>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewAllText: {
      color: '#3B82F6',
      marginRight: 2,
    },
    summaryContainer: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 20,
    },
    summaryLeft: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    avgRatingText: {
      lineHeight: 40,
    },
    totalReviewsText: {
      color: theme.colors.text.secondary,
      marginTop: 4,
    },
    summaryRight: {
      flex: 1,
      justifyContent: 'center',
      gap: 6,
    },
    ratingBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    starLabel: {
      width: 12,
      color: theme.colors.text.secondary,
    },
    progressBarBg: {
      flex: 1,
      height: 6,
      backgroundColor: '#F3F4F6',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#FFB800',
      borderRadius: 3,
    },
    starsRow: {
      flexDirection: 'row',
    },
    reviewList: {
      gap: 24,
    },
    reviewItem: {
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      paddingBottom: 16,
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#3B82F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      overflow: 'hidden',
    },
    avatarImg: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      color: '#FFFFFF',
    },
    reviewInfo: {
      flex: 1,
    },
    reviewMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    metaDot: {
      marginHorizontal: 6,
      color: '#9CA3AF',
    },
    timeText: {
      color: theme.colors.text.tertiary,
    },
    comment: {
      lineHeight: 22,
      color: theme.colors.text.primary,
      marginBottom: 12,
    },
    reviewImages: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    reviewImage: {
      width: 100,
      height: 100,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
    },
    absoluteTime: {
      color: '#9CA3AF',
      marginTop: 4,
    },
    noReviews: {
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      paddingVertical: 10,
    },
  });

export default ProductReviews;
