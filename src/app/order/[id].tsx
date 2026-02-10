import { Feather, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button } from '@/components';
import { useTheme, useLanguage, useAuth } from '@/contexts';
import { fetchOrderDetail, Order, OrderItem } from '@/services/supabase/orderService';
import { fetchReviewsForOrder, ProductReview } from '@/services/supabase/productService';
import OrderReviewModal from '@/components/order/OrderReviewModal';

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
  const { getUserId } = useAuth();
  const userId = getUserId();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  // Helper to refresh data
  const loadOrder = async () => {
    if (!id || !userId) return;

    setLoading(true);
    const { order: orderData, items: itemsData } = await fetchOrderDetail(id);
    setOrder(orderData);
    setItems(itemsData);

    // Fetch reviews
    const reviewsData = await fetchReviewsForOrder(id, userId);
    setReviews(reviewsData);

    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [id, userId]);

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

  const renderStars = (rating: number) => {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FontAwesome
            key={star}
            name={star <= rating ? 'star' : 'star-o'}
            size={14}
            color={star <= rating ? '#FFC107' : theme.colors.border.primary}
          />
        ))}
      </View>
    );
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

  const isReviewed = reviews.length > 0;

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
            {t('order.productsOrdered')}
          </Typography>

          {items.map((item) => {
            const itemTotal = formatPrice(item.total_price);
            // Find review for this item (by product_id)
            const review = reviews.find(r => r.product_id === item.product_id);

            return (
              <View key={item.id} style={styles.orderItemWrapper}>
                <View style={styles.orderItem}>
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

                {/* Review Details */}
                {review && (
                  <View style={styles.reviewDetail}>
                    <View style={styles.reviewHeader}>
                      <Typography variant="text" size="sm" weight="semiBold" style={{ marginRight: 8, color: theme.colors.text.brand_primary }}>
                        {t('order.review.reviewedTitle')}
                      </Typography>
                      {renderStars(review.rating)}
                    </View>
                    {review.content && (
                      <Typography variant="text" size="sm" style={styles.reviewComment}>
                        {review.content}
                      </Typography>
                    )}
                    {review.images && review.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImages}>
                        {review.images.map((img, idx) => (
                          <Image key={idx} source={{ uri: img }} style={styles.reviewImage} />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
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
            {order.shipping_address?.full_name && (
              <View style={styles.infoRow}>
                <Feather name='user' size={18} color={theme.colors.text.tertiary} />
                <Typography variant='text' size='md' style={styles.infoText}>
                  {order.shipping_address.full_name}
                </Typography>
              </View>
            )}
            {order.shipping_address?.phone && (
              <View style={styles.infoRow}>
                <Feather name='phone' size={18} color={theme.colors.text.tertiary} />
                <Typography variant='text' size='md' style={styles.infoText}>
                  {order.shipping_address.phone}
                </Typography>
              </View>
            )}
            {order.shipping_address && (
              <View style={styles.infoRow}>
                <Feather name='map-pin' size={18} color={theme.colors.text.tertiary} />
                <Typography variant='text' size='md' style={styles.infoText}>
                  {[
                    order.shipping_address.address_line1,
                    order.shipping_address.address_line2,
                    order.shipping_address.ward,
                    order.shipping_address.district,
                    order.shipping_address.city,
                    order.shipping_address.province,
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
                  {t('checkout.discount')}
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

      {/* Footer Actions */}
      {order.status === 'delivered' && (
        <View style={styles.footer}>
          {isReviewed ? (
            <Button
              variant='outline'
              colorScheme='gray'
              size='lg'
              disabled
              style={{ width: '100%', opacity: 0.7 }}
            >
              {t('order.review.reviewed')}
            </Button>
          ) : (
            <Button
              variant='solid'
              colorScheme='brand'
              size='lg'
              onPress={() => setReviewModalVisible(true)}
              style={{ width: '100%' }}
            >
              {t('order.review.title')}
            </Button>
          )}
        </View>
      )}

      {order && items.length > 0 && (
        <OrderReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          orderId={order.id}
          items={items}
          onReviewSubmitted={() => {
            loadOrder(); // Refresh to show reviews
            setReviewModalVisible(false);
          }}
        />
      )}
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
    orderItemWrapper: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    orderItem: {
      flexDirection: 'row',
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
    reviewDetail: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.secondary,
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    reviewComment: {
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    reviewImages: {
      flexDirection: 'row',
      marginTop: 4,
    },
    reviewImage: {
      width: 60,
      height: 60,
      borderRadius: 4,
      marginRight: 8,
    },
    infoCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
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
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      backgroundColor: theme.colors.background.primary,
    },
  });

export default OrderDetailScreen;
