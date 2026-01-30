import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, CartIcon } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { fetchProductDetail } from '@/services/supabase';
import type { ProductDetail, ProductReview, User } from '@/types/database.types';

dayjs.extend(relativeTime);

const ProductReviewsScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const theme = useTheme();
    const { t, language } = useLanguage();
    const styles = createStyles(theme);

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Set dayjs locale based on language
    useEffect(() => {
        if (language === 'vi') {
            dayjs.locale('vi');
        } else if (language === 'jp') {
            dayjs.locale('ja');
        } else {
            dayjs.locale('en');
        }
    }, [language]);

    useEffect(() => {
        const loadProduct = async () => {
            if (!id) return;
            setLoading(true);
            const productData = await fetchProductDetail(id);
            setProduct(productData);
            setLoading(false);
        };

        loadProduct();
    }, [id]);

    const reviews = product?.reviews || [];
    const avgRating = product?.avg_rating || 0;
    const totalReviews = product?.review_count || 0;

    // Calculate rating distribution
    const ratingCounts = React.useMemo(() => {
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

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size='large' color={theme.colors.text.brand_primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
                </Pressable>
                <Typography variant='text' size='lg' weight='bold' style={styles.headerTitle}>
                    {t('product.reviews') || 'Đánh giá sản phẩm'}
                </Typography>
                <CartIcon />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Summary Section */}
                <View style={styles.summaryContainer}>
                    {/* Left: Overall Rating */}
                    <View style={styles.summaryLeft}>
                        <Typography variant='display' size='lg' weight='bold'>
                            {avgRating.toFixed(1)}
                        </Typography>
                        <View style={{ marginVertical: 6 }}>{renderStars(Math.round(avgRating), 16)}</View>
                        <Typography variant='text' size='sm' style={styles.totalReviewsText}>
                            {totalReviews} {t('product.rating') || 'đánh giá'}
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

                {/* Your Review Section (if logged in user) */}
                {reviews.length > 0 && reviews[0]?.user && (
                    <View style={styles.sectionContainer}>
                        <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
                            Người dùng Service (Bạn)
                        </Typography>
                        {/* Show the first review as "your" review - in production this should filter by current user */}
                    </View>
                )}

                {/* Other Reviews Section */}
                <View style={styles.sectionContainer}>
                    <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
                        Từ người khác
                    </Typography>

                    {reviews.length > 0 ? (
                        reviews.map((review) => {
                            const reviewAny = review as any;
                            const images = Array.isArray(reviewAny.images)
                                ? reviewAny.images
                                : reviewAny.images
                                    ? [reviewAny.images]
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
                            {t('product.noReviews') || 'Chưa có đánh giá nào.'}
                        </Typography>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
            alignItems: 'center',
            paddingHorizontal: 8,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
        },
        backButton: {
            padding: 8,
        },
        headerTitle: {
            flex: 1,
            textAlign: 'center',
        },
        summaryContainer: {
            flexDirection: 'row',
            padding: 16,
            gap: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
        },
        summaryLeft: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        totalReviewsText: {
            color: theme.colors.text.secondary,
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
        sectionContainer: {
            padding: 16,
        },
        sectionTitle: {
            marginBottom: 16,
        },
        reviewItem: {
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
            paddingBottom: 16,
            marginBottom: 16,
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
            flexWrap: 'wrap',
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
            paddingVertical: 20,
        },
    });

export default ProductReviewsScreen;
