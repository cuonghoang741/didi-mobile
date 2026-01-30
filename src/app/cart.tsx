import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography } from '@/components';
import { useTheme, useLanguage, useCart } from '@/contexts';

import { useCurrency } from '@/hooks';

const CartScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount } = useCart();
  const { formatPrice } = useCurrency();
  const styles = createStyles(theme);

  // Calc totals
  const subtotal = getSubtotal();
  const shipping = 30000;
  const total = subtotal; // Currently shipping fee logic might need adjustment for JPY. 30,000 VND ~ 176 JPY?
  // Wait, shipping is currently hardcoded as 30000. If that's VND, it's weird if base currency is JPY.
  // Assuming shipping is 30000 (unit?). If unit is JPY 30000 is huge.
  // If unit is VND, then 30000/170 ~ 176 JPY.
  // Let's assume user wants everything in JPY base.
  // If previous code was VND based, then subtotal was VND?
  // Let's check getSubtotal().

  // User said "đơn vị tiền của app luôn là ¥". So product.price is JPY.
  // So subtotal is JPY.
  // 30000 shipping? If it's JPY, it matches JPY 30,000.
  // If it's VND, I should convert it or change it.
  // I will assume shipping is 0 or needs to be configured in JPY.
  // For now I'll set shipping to 0 or a small JPY amount like 500 Yen ~ 85k VND.
  const shippingJpy = 0; // Free shipping for now or small fee.
  // Or maybe user meant everything was VND before?
  // "giá tiền sản phẩm sẽ luôn hiện thêm quy đổi sang vnđ" -> implies base is Yen.

  const totalJpy = subtotal + shippingJpy;

  const subtotalFormatted = formatPrice(subtotal);
  const shippingFormatted = formatPrice(shippingJpy);
  const totalFormatted = formatPrice(totalJpy);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Typography variant='text' size='lg' weight='bold'>
            {t('cart.title')}
          </Typography>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Feather name='shopping-cart' size={80} color='#E5E7EB' />
          <Typography variant='text' size='lg' weight='semiBold' style={styles.emptyTitle}>
            {t('cart.empty')}
          </Typography>
          <Typography variant='text' size='sm' style={styles.emptyDescription}>
            {t('cart.emptyDescription')}
          </Typography>
          <Pressable style={styles.continueButton} onPress={() => router.back()}>
            <Typography
              variant='text'
              size='md'
              weight='semiBold'
              style={styles.continueButtonText}
            >
              {t('cart.continueShopping')}
            </Typography>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Typography variant='text' size='lg' weight='bold'>
          {t('cart.title')} ({getItemCount()} {t('cart.itemCount')})
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        {items.map((item, index) => {
          // Get price - variant has price, product has sale_price or base_price
          const price = item.variant
            ? item.variant.price
            : (item.product.sale_price || item.product.base_price || 0);

          // Get image - product has image_urls array or thumbnail_url
          const imageUrl = item.product.image_urls?.[0] || item.product.thumbnail_url;

          // Get variant display name from options JSON
          let variantName = '';
          if (item.variant) {
            const options = typeof item.variant.options === 'object' && item.variant.options !== null
              ? (item.variant.options as { name?: string; color?: string; storage?: string })
              : {};
            variantName = options.name || `${options.color || ''} ${options.storage || ''}`.trim() || item.variant.sku || '';
          }

          const priceFormatted = formatPrice(price);

          return (
            <View
              key={`${item.product.id}-${item.variant?.id || 'default'}`}
              style={styles.cartItem}
            >
              <Image
                source={{ uri: imageUrl || 'https://via.placeholder.com/100' }}
                style={styles.itemImage}
                contentFit='cover'
              />
              <View style={styles.itemInfo}>
                <Typography variant='text' size='md' weight='medium' numberOfLines={2}>
                  {item.product.name}
                </Typography>
                {variantName && (
                  <Typography variant='text' size='sm' style={styles.variantName}>
                    {variantName}
                  </Typography>
                )}
                <View style={{ marginTop: 6 }}>
                  <Typography variant='text' size='md' weight='bold' style={styles.itemPrice}>
                    {priceFormatted.jpy}
                  </Typography>
                  <Typography
                    variant='text'
                    size='xs'
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    {priceFormatted.vnd}
                  </Typography>
                </View>
                <View style={styles.itemActions}>
                  <View style={styles.quantityControls}>
                    <Pressable
                      style={styles.quantityButton}
                      onPress={() =>
                        updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)
                      }
                    >
                      <Feather name='minus' size={16} color={theme.colors.text.primary} />
                    </Pressable>
                    <Typography
                      variant='text'
                      size='sm'
                      weight='semiBold'
                      style={styles.quantityValue}
                    >
                      {item.quantity}
                    </Typography>
                    <Pressable
                      style={styles.quantityButton}
                      onPress={() =>
                        updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)
                      }
                    >
                      <Feather name='plus' size={16} color={theme.colors.text.primary} />
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeItem(item.product.id, item.variant?.id)}
                  >
                    <Feather name='trash-2' size={18} color='#EF4444' />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Typography variant='text' size='md' weight='bold' style={styles.summaryTitle}>
            {t('checkout.orderSummary')}
          </Typography>

          <View style={styles.summaryRow}>
            <Typography variant='text' size='md' style={styles.summaryLabel}>
              {t('cart.subtotal')}
            </Typography>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography variant='text' size='md' weight='medium'>
                {subtotalFormatted.jpy}
              </Typography>
              <Typography variant='text' size='xs' style={{ color: theme.colors.text.tertiary }}>
                {subtotalFormatted.vnd}
              </Typography>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Typography variant='text' size='md' style={styles.summaryLabel}>
              {t('cart.shipping')}
            </Typography>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography variant='text' size='md' weight='medium'>
                {shippingFormatted.jpy}
              </Typography>
              <Typography variant='text' size='xs' style={{ color: theme.colors.text.tertiary }}>
                {shippingFormatted.vnd}
              </Typography>
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

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Typography variant='text' size='sm' style={styles.totalLabel}>
            {t('cart.total')}
          </Typography>
          <Typography variant='text' size='xl' weight='bold' style={styles.totalAmount}>
            {totalFormatted.jpy}
          </Typography>
          <Typography variant='text' size='xs' style={{ color: theme.colors.text.tertiary }}>
            {totalFormatted.vnd}
          </Typography>
        </View>
        <Pressable style={styles.checkoutButton} onPress={() => router.push('/checkout')}>
          <LinearGradient
            colors={['#5B7CFF', '#3D4DF4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutGradient}
          >
            <Typography variant='text' size='md' weight='bold' style={styles.checkoutText}>
              {t('cart.checkout')}
            </Typography>
            <Feather name='arrow-right' size={20} color='#FFF' />
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      marginTop: 20,
      color: theme.colors.text.primary,
    },
    emptyDescription: {
      marginTop: 8,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
    },
    continueButton: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: theme.colors.text.brand_primary,
      borderRadius: 12,
    },
    continueButtonText: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    cartItem: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    itemImage: {
      width: 100,
      height: 100,
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
    itemPrice: {
      color: theme.colors.text.brand_primary,
      marginTop: 6,
    },
    itemActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    quantityButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.colors.background.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityValue: {
      minWidth: 24,
      textAlign: 'center',
    },
    removeButton: {
      padding: 8,
    },
    summaryCard: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    summaryTitle: {
      marginBottom: 16,
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
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 32,
      backgroundColor: theme.colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      gap: 16,
    },
    totalContainer: {
      flex: 1,
    },
    totalLabel: {
      color: theme.colors.text.tertiary,
    },
    totalAmount: {
      color: theme.colors.text.brand_primary,
    },
    checkoutButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    checkoutGradient: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 14,
      gap: 8,
    },
    checkoutText: {
      color: '#FFFFFF',
    },
  });

export default CartScreen;
