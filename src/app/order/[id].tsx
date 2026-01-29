import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography } from '@/components';
import { useTheme, useLanguage } from '@/contexts';
import { fetchOrderDetail } from '@/services/supabase';
import type { Order, OrderItem } from '@/types/database.types';

import { useCurrency } from '@/hooks';

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const OrderDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency(); // Hook usage
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      setLoading(true);
      const { order: orderData, items: itemsData } = await fetchOrderDetail(id);
      setOrder(orderData);
      setItems(itemsData);
      setLoading(false);
    };

    loadOrder();
  }, [id]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
      case 'processing':
        return '#3B82F6';
      case 'shipping':
        return '#8B5CF6';
      case 'delivered':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getPaymentMethodLabel = (method: string | null): string => {
    switch (method) {
      case 'at_store':
        return t('checkout.atStore');
      case 'bank_transfer':
        return t('checkout.bankTransfer');
      case 'daibiki':
        return t('checkout.daibiki');
      default:
        return method || '';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size='large' color={theme.colors.text.brand_primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.center]}>
        <Typography variant='text' size='md'>
          {t('common.error')}
        </Typography>
      </View>
    );
  }

  // Formatting variables
  const subtotalFormatted = formatPrice(order.subtotal);
  const shippingFormatted = formatPrice(order.shipping_fee || 0);
  const discountFormatted = order.discount_amount ? formatPrice(order.discount_amount) : null;
  const totalFormatted = formatPrice(order.total_amount);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Typography variant='text' size='lg' weight='bold'>
          {t('order.orderNumber')}
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Number & Status */}
        <View style={styles.orderHeader}>
          <Typography variant='text' size='lg' weight='bold' style={styles.orderNumber}>
            #{order.order_number}
          </Typography>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}
          >
            <Typography
              variant='text'
              size='sm'
              weight='semiBold'
              style={{ color: getStatusColor(order.status) }}
            >
              {t(`order.status.${order.status}` as any)}
            </Typography>
          </View>
        </View>

        <Typography variant='text' size='sm' style={styles.orderDate}>
          {formatDate(order.created_at)}
        </Typography>

        {/* Order Items */}
        <View style={styles.section}>
          <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
            Sản phẩm đã đặt
          </Typography>

          {items.map((item) => {
            const itemTotal = formatPrice(item.total_price);
            return (
              <View key={item.id} style={styles.orderItem}>
                <Image
                  source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
                  style={styles.itemImage}
                  contentFit='cover'
                />
                <View style={styles.itemInfo}>
                  <Typography variant='text' size='md' weight='medium' numberOfLines={2}>
                    {item.product_name}
                  </Typography>
                  {item.variant_name && (
                    <Typography variant='text' size='sm' style={styles.variantName}>
                      {item.variant_name}
                    </Typography>
                  )}
                  <View style={styles.itemPriceRow}>
                    <Typography variant='text' size='sm' style={styles.quantity}>
                      x{item.quantity}
                    </Typography>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Typography
                        variant='text'
                        size='md'
                        weight='semiBold'
                        style={styles.itemPrice}
                      >
                        {itemTotal.jpy}
                      </Typography>
                      <Typography
                        variant='text'
                        size='xs'
                        style={{ color: theme.colors.text.tertiary }}
                      >
                        {itemTotal.vnd}
                      </Typography>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Shipping Info */}
        <View style={styles.section}>
          <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
            {t('checkout.shippingInfo')}
          </Typography>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name='user' size={18} color={theme.colors.text.tertiary} />
              <Typography variant='text' size='md' style={styles.infoText}>
                {order.shipping_name}
              </Typography>
            </View>
            <View style={styles.infoRow}>
              <Feather name='phone' size={18} color={theme.colors.text.tertiary} />
              <Typography variant='text' size='md' style={styles.infoText}>
                {order.shipping_phone}
              </Typography>
            </View>
            {order.shipping_email && (
              <View style={styles.infoRow}>
                <Feather name='mail' size={18} color={theme.colors.text.tertiary} />
                <Typography variant='text' size='md' style={styles.infoText}>
                  {order.shipping_email}
                </Typography>
              </View>
            )}
            {order.shipping_address && (
              <View style={styles.infoRow}>
                <Feather name='map-pin' size={18} color={theme.colors.text.tertiary} />
                <Typography variant='text' size='md' style={styles.infoText}>
                  {[
                    order.shipping_address,
                    order.shipping_ward,
                    order.shipping_district,
                    order.shipping_city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Typography>
              </View>
            )}
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.section}>
          <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
            {t('checkout.paymentMethod')}
          </Typography>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name='credit-card' size={18} color={theme.colors.text.tertiary} />
              <Typography variant='text' size='md' style={styles.infoText}>
                {getPaymentMethodLabel(order.payment_method)}
              </Typography>
            </View>
            <View
              style={[
                styles.paymentStatusBadge,
                {
                  backgroundColor: order.payment_status === 'paid' ? '#10B98120' : '#F59E0B20',
                },
              ]}
            >
              <Typography
                variant='text'
                size='sm'
                weight='medium'
                style={{ color: order.payment_status === 'paid' ? '#10B981' : '#F59E0B' }}
              >
                {t(`order.paymentStatus.${order.payment_status || 'pending'}` as any)}
              </Typography>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
            {t('checkout.orderSummary')}
          </Typography>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Typography variant='text' size='md' style={styles.summaryLabel}>
                {t('cart.subtotal')}
              </Typography>
              <View style={{ alignItems: 'flex-end' }}>
                <Typography variant='text' size='md'>
                  {subtotalFormatted.jpy}
                </Typography>
                <Typography variant='text' size='xs' style={{ color: theme.colors.text.tertiary }}>
                  {subtotalFormatted.vnd}
                </Typography>
              </View>
            </View>

            {discountFormatted && (
              <View style={styles.summaryRow}>
                <Typography variant='text' size='md' style={styles.summaryLabel}>
                  Giảm giá
                </Typography>
                <View style={{ alignItems: 'flex-end' }}>
                  <Typography variant='text' size='md' style={{ color: '#10B981' }}>
                    -{discountFormatted.jpy}
                  </Typography>
                  <Typography
                    variant='text'
                    size='xs'
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    -{discountFormatted.vnd}
                  </Typography>
                </View>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Typography variant='text' size='md' style={styles.summaryLabel}>
                {t('cart.shipping')}
              </Typography>
              <View style={{ alignItems: 'flex-end' }}>
                <Typography variant='text' size='md'>
                  {order.shipping_fee === 0 ? t('checkout.freeShipping') : shippingFormatted.jpy}
                </Typography>
                {(order.shipping_fee || 0) > 0 && (
                  <Typography
                    variant='text'
                    size='xs'
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    {shippingFormatted.vnd}
                  </Typography>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Typography variant='text' size='lg' weight='bold'>
                {t('cart.total')}
              </Typography>
              <View style={{ alignItems: 'flex-end' }}>
                <Typography variant='text' size='lg' weight='bold' style={styles.totalPrice}>
                  {totalFormatted.jpy}
                </Typography>
                <Typography variant='text' size='sm' style={{ color: theme.colors.text.tertiary }}>
                  {totalFormatted.vnd}
                </Typography>
              </View>
            </View>
          </View>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    backButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    orderNumber: {
      color: theme.colors.text.primary,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    orderDate: {
      color: theme.colors.text.tertiary,
      marginTop: 4,
      marginBottom: 24,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    orderItem: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
    },
    itemInfo: {
      flex: 1,
      marginLeft: 12,
    },
    variantName: {
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    itemPriceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    quantity: {
      color: theme.colors.text.tertiary,
    },
    itemPrice: {
      color: theme.colors.text.brand_primary,
    },
    infoCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      gap: 12,
    },
    infoText: {
      flex: 1,
      color: theme.colors.text.primary,
    },
    paymentStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    summaryCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryLabel: {
      color: theme.colors.text.secondary,
    },
    divider: {
      height: 1,
      backgroundColor: '#E5E7EB',
      marginVertical: 12,
    },
    totalPrice: {
      color: theme.colors.text.brand_primary,
    },
  });

export default OrderDetailScreen;
