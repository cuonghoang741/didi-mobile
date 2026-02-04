import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { useCurrency } from '@/hooks';
import { fetchOrderDetail, Order, OrderItem } from '@/services/supabase/orderService';
import { FakeBorderPaperOrder } from '@/components/ui/FakeBorderPaperOrder';

const HERO_IMAGE = require('@/assets/images/hero-success.png');

const OrderSuccessScreen = () => {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const styles = createStyles(theme);

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      try {
        const { order, items } = await fetchOrderDetail(orderId);
        setOrder(order);
        setItems(items);
      } catch (error) {
        console.error('Error loading order success:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleBackHome = () => {
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={theme.colors.foreground.brand_primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Typography>Order not found</Typography>
        <Button onPress={handleBackHome} style={{ marginTop: 20 }}>
          {t('common.backToHome')}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <Image
        source={HERO_IMAGE}
        style={styles.heroImage}
        contentFit="cover"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ticketCard}>
            <FakeBorderPaperOrder position="top" />
            <View style={styles.cardBody}>
              {/* Header Section */}
              <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                  <Typography variant='text' size='xl' weight='bold' style={styles.successTitle}>
                    {t('order.success') || 'Đặt hàng thành công!'}
                  </Typography>
                  <Typography variant='text' size='sm' style={styles.orderNumber}>
                    {t('order.orderNumber')}: #{order.order_number}
                  </Typography>
                </View>
                <View style={styles.checkIconContainer}>
                  <Feather name='check' size={24} color='white' />
                </View>
              </View>

              <View style={styles.dashedDivider} />

              {/* Customer Info */}
              <View style={styles.section}>
                <View style={styles.infoRow}>
                  <Feather name='user' size={20} color='#3B82F6' style={styles.infoIcon} />
                  <View>
                    <Typography variant='text' weight='bold'>
                      {order.shipping_address?.full_name || 'Khách hàng'}
                    </Typography>
                    <Typography variant='text' size='sm' style={styles.subText}>
                      {order.shipping_address?.phone || ''}
                    </Typography>
                  </View>
                </View>

                <View style={[styles.infoRow, { marginTop: 16 }]}>
                  <Feather name='map-pin' size={20} color='#3B82F6' style={styles.infoIcon} />
                  <View style={{ flex: 1 }}>
                    <Typography variant='text' weight='bold'>
                      {order.payment_method === 'at_store' ? 'Nhận tại cửa hàng' : 'Giao hàng tận nơi'}
                    </Typography>
                    <Typography variant='text' size='sm' style={styles.subText} numberOfLines={2}>
                      {order.payment_method === 'at_store'
                        ? 'Tại cửa hàng DiDi Mobile'
                        : `${order.shipping_address?.address_line1}, ${order.shipping_address?.ward}, ${order.shipping_address?.district}, ${order.shipping_address?.city}`}
                    </Typography>
                  </View>
                </View>
              </View>

              <View style={styles.dashedDivider} />

              {/* Products */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name='bookmark' size={18} color='#3B82F6' />
                  <Typography variant='text' weight='medium' style={{ marginLeft: 8 }}>
                    {t('common.products')}
                  </Typography>
                </View>

                {items.map((item, index) => (
                  <View key={item.id} style={[styles.productRow, index > 0 && { marginTop: 12 }]}>
                    <View style={{ flex: 1 }}>
                      <Typography variant='text' weight='medium' numberOfLines={1}>
                        {item.product_name}
                      </Typography>
                      <Typography variant='text' size='sm' style={styles.subText}>
                        x{item.quantity}
                      </Typography>
                    </View>
                    <Typography variant='text' weight='bold' style={styles.priceText}>
                      {formatPrice(item.unit_price).jpy}
                    </Typography>
                  </View>
                ))}
              </View>

              <View style={styles.dashedDivider} />

              {/* Total */}
              <View style={styles.section}>
                <View style={styles.totalRow}>
                  <Typography variant='text' weight='bold'>
                    {t('cart.total') || 'Tổng cộng'}
                  </Typography>
                  <Typography variant='text' size='lg' weight='bold' style={styles.totalPrice}>
                    {formatPrice(order.total_amount).jpy}
                  </Typography>
                </View>

                <View style={[styles.totalRow, { marginTop: 12 }]}>
                  <Typography variant='text' style={styles.subText}>
                    {t('order.paymentStatusLabel')}
                  </Typography>
                  <View style={styles.statusBadge}>
                    <Typography variant='text' size='xs' style={styles.statusText}>
                      {order.payment_status === 'paid' ? t('order.paymentStatus.paid') : t('order.paymentStatus.pending')}
                    </Typography>
                  </View>
                </View>
              </View>
            </View>
            <FakeBorderPaperOrder position="bottom" />
          </View>

          {/* Add extra padding at bottom for the fixed button */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <Button
          variant='solid'
          size='lg'
          fullWidth
          onPress={handleBackHome}
          style={styles.homeButton}
        >
          {t('order.backToHome') || 'Về trang chủ'}
        </Button>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F3F4F6', // Light gray background
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background.primary,
    },
    heroImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 250, // Adjust based on image aspect ratio
      width: '100%',
    },
    scrollContent: {
      paddingTop: 140, // Push content down to show hero
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    ticketCard: {
      backgroundColor: 'transparent',
      // Remove borderRadius to let edges do the work
      // Shadow logic: On iOS this shadows the opaque children. On Android 28+ it might work if outline provider is used, but usually needs background.
      // We'll keep shadow props for iOS at least.
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      // elevation: 5, // Android elevation won't clip to jagged edges easily.
      marginTop: 20,
    },
    cardBody: {
      backgroundColor: 'white',
      // No border radius here, just rect
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
    },
    headerInfo: {
      flex: 1,
    },
    successTitle: {
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    orderNumber: {
      color: theme.colors.text.secondary,
    },
    checkIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#10B981', // Green
      justifyContent: 'center',
      alignItems: 'center',
    },
    dashedDivider: {
      height: 1,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderStyle: 'dashed',
      marginHorizontal: 20,
    },
    section: {
      padding: 20,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    infoIcon: {
      marginTop: 2,
    },
    subText: {
      color: theme.colors.text.secondary,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    productRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    priceText: {
      color: '#DC2626', // Red
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalPrice: {
      color: theme.colors.text.primary,
    },
    statusBadge: {
      backgroundColor: '#DBEAFE', // Light blue
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#1E40AF', // Dark blue
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      padding: 16,
      paddingBottom: 34, // Safe area compensation
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    homeButton: {
      backgroundColor: '#111827', // Black/Dark
    },
  });

export default OrderSuccessScreen;
