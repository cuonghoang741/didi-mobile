import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SkeletonBox: React.FC<{
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
}> = ({ width, height, borderRadius = 8, style }) => {
    const theme = useTheme();
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#E5E7EB',
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    transform: [{ translateX }],
                }}
            >
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                    }}
                >
                    <View style={{ flex: 1, backgroundColor: 'transparent' }} />
                    <View
                        style={{
                            width: 100,
                            backgroundColor: 'rgba(255,255,255,0.3)',
                        }}
                    />
                    <View style={{ flex: 1, backgroundColor: 'transparent' }} />
                </View>
            </Animated.View>
        </View>
    );
};

const HomeSkeleton: React.FC = () => {
    const theme = useTheme();
    const styles = createStyles(theme);

    const CATEGORY_SIZE = (SCREEN_WIDTH - 32 - 36) / 4;

    return (
        <View style={styles.container}>
            {/* Banner Skeleton */}
            <View style={styles.bannerContainer}>
                <SkeletonBox width={SCREEN_WIDTH - 32} height={180} borderRadius={16} />
                {/* Dots */}
                <View style={styles.dotsContainer}>
                    <SkeletonBox width={24} height={8} borderRadius={4} />
                    <SkeletonBox width={8} height={8} borderRadius={4} style={{ marginLeft: 6 }} />
                    <SkeletonBox width={8} height={8} borderRadius={4} style={{ marginLeft: 6 }} />
                </View>
            </View>

            {/* Categories Skeleton */}
            <View style={styles.categoriesContainer}>
                <View style={styles.categoriesRow}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={styles.categoryItem}>
                            <SkeletonBox width={CATEGORY_SIZE - 10} height={CATEGORY_SIZE - 10} borderRadius={(CATEGORY_SIZE - 10) / 2} />
                            <SkeletonBox width={CATEGORY_SIZE - 20} height={12} borderRadius={4} style={{ marginTop: 8 }} />
                        </View>
                    ))}
                </View>
                <View style={[styles.categoriesRow, { marginTop: 12 }]}>
                    {[5, 6, 7, 8].map((i) => (
                        <View key={i} style={styles.categoryItem}>
                            <SkeletonBox width={CATEGORY_SIZE - 10} height={CATEGORY_SIZE - 10} borderRadius={(CATEGORY_SIZE - 10) / 2} />
                            <SkeletonBox width={CATEGORY_SIZE - 20} height={12} borderRadius={4} style={{ marginTop: 8 }} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Flash Sale Section Skeleton */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <SkeletonBox width={120} height={20} borderRadius={4} />
                    <SkeletonBox width={80} height={16} borderRadius={4} />
                </View>
                <View style={styles.productsRow}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.flashSaleCard}>
                            <SkeletonBox width={140} height={120} borderRadius={8} />
                            <View style={styles.productInfo}>
                                <SkeletonBox width={120} height={14} borderRadius={4} />
                                <SkeletonBox width={80} height={16} borderRadius={4} style={{ marginTop: 6 }} />
                                <SkeletonBox width={100} height={8} borderRadius={4} style={{ marginTop: 8 }} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Featured Products Section Skeleton */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <SkeletonBox width={140} height={20} borderRadius={4} />
                    <SkeletonBox width={60} height={16} borderRadius={4} />
                </View>
                <View style={styles.productsRow}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.productCard}>
                            <SkeletonBox width={150} height={150} borderRadius={12} />
                            <View style={styles.productInfo}>
                                <SkeletonBox width={130} height={14} borderRadius={4} />
                                <SkeletonBox width={90} height={16} borderRadius={4} style={{ marginTop: 6 }} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {/* Category Products Section Skeleton */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <SkeletonBox width={100} height={20} borderRadius={4} />
                    <SkeletonBox width={60} height={16} borderRadius={4} />
                </View>
                <View style={styles.productsRow}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.productCard}>
                            <SkeletonBox width={150} height={150} borderRadius={12} />
                            <View style={styles.productInfo}>
                                <SkeletonBox width={130} height={14} borderRadius={4} />
                                <SkeletonBox width={90} height={16} borderRadius={4} style={{ marginTop: 6 }} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background.primary,
            paddingTop: 12,
        },
        bannerContainer: {
            paddingHorizontal: 16,
            marginBottom: 24,
        },
        dotsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 12,
        },
        categoriesContainer: {
            paddingHorizontal: 16,
            marginBottom: 24,
        },
        categoriesRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        categoryItem: {
            alignItems: 'center',
        },
        sectionContainer: {
            marginBottom: 24,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            marginBottom: 12,
        },
        productsRow: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            gap: 12,
        },
        flashSaleCard: {
            width: 140,
            backgroundColor: theme.colors.background.primary,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            overflow: 'hidden',
        },
        productCard: {
            width: 150,
        },
        productInfo: {
            padding: 10,
        },
    });

export default HomeSkeleton;
