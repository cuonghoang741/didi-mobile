import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LEFT_PANEL_WIDTH = SCREEN_WIDTH * 0.22;

const SkeletonBox: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}> = ({ width, height, borderRadius = 8, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
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
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ flex: 1, backgroundColor: 'transparent' }} />
          <View style={{ width: 80, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <View style={{ flex: 1, backgroundColor: 'transparent' }} />
        </View>
      </Animated.View>
    </View>
  );
};

const CategoriesSkeleton: React.FC = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const RIGHT_PANEL_WIDTH = SCREEN_WIDTH - LEFT_PANEL_WIDTH;
  const PRODUCT_WIDTH = (RIGHT_PANEL_WIDTH - 32 - 12) / 2;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left Panel - Categories */}
        <View style={styles.leftPanel}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <View key={i} style={styles.categoryItem}>
              <SkeletonBox width={40} height={40} borderRadius={8} />
              <SkeletonBox width={60} height={10} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>

        {/* Right Panel - Products */}
        <View style={styles.rightPanel}>
          {/* Category Title */}
          <View style={styles.categoryHeader}>
            <SkeletonBox width={150} height={24} borderRadius={6} />
          </View>

          {/* Brands Section */}
          <View style={styles.brandsSection}>
            <SkeletonBox width={100} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
            <View style={styles.brandsRow}>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonBox key={i} width={80} height={40} borderRadius={8} />
              ))}
            </View>
          </View>

          {/* Products Grid */}
          <View style={styles.productsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[styles.productCard, { width: PRODUCT_WIDTH }]}>
                <SkeletonBox width='100%' height={120} borderRadius={8} />
                <View style={styles.productInfo}>
                  <SkeletonBox width='90%' height={14} borderRadius={4} />
                  <SkeletonBox width='60%' height={14} borderRadius={4} style={{ marginTop: 6 }} />
                  <SkeletonBox width='50%' height={16} borderRadius={4} style={{ marginTop: 8 }} />
                </View>
              </View>
            ))}
          </View>
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
    },
    content: {
      flex: 1,
      flexDirection: 'row',
    },
    leftPanel: {
      width: LEFT_PANEL_WIDTH,
      backgroundColor: '#F9FAFB',
      borderRightWidth: 1,
      borderRightColor: '#E4E7EC',
      paddingTop: 12,
    },
    categoryItem: {
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    rightPanel: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    categoryHeader: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    brandsSection: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    brandsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    productsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 12,
    },
    productCard: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      overflow: 'hidden',
    },
    productInfo: {
      padding: 10,
    },
  });

export default CategoriesSkeleton;
