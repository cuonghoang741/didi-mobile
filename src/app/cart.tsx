import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useMemo, useEffect } from 'react';
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

  // Selected items state - default all selected (excluding out of stock)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Initialize selected items when items change
  useEffect(() => {
    const inStockItemIds = items
      .filter(item => {
        const stockQty = item.variant?.stock_quantity ?? (item.product as any).stock_quantity ?? null;
        const isOutOfStock = stockQty === 0;
        return !isOutOfStock;
      })
      .map(item => `${item.product.id}-${item.variant?.id || 'default'}`);
    setSelectedItems(new Set(inStockItemIds));
  }, [items]);

  const toggleItemSelection = (itemKey: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const inStockItemIds = items
      .filter(item => {
        const stockQty = item.variant?.stock_quantity ?? (item.product as any).stock_quantity ?? null;
        const isOutOfStock = stockQty === 0;
        return !isOutOfStock;
      })
      .map(item => `${item.product.id}-${item.variant?.id || 'default'}`);

    if (selectedItems.size === inStockItemIds.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(inStockItemIds));
    }
  };

  // Calculate totals only for selected items
  const selectedSubtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const itemKey = `${item.product.id}-${item.variant?.id || 'default'}`;
      if (!selectedItems.has(itemKey)) return total;

      const price = item.variant
        ? item.variant.price
        : (item.product.sale_price || item.product.base_price || 0);
      return total + (price * item.quantity);
    }, 0);
  }, [items, selectedItems]);

  const shippingJpy = 0;
  const totalJpy = selectedSubtotal + shippingJpy;
  const totalFormatted = formatPrice(totalJpy);

  const inStockItemsCount = items.filter(item => {
    const stockQty = item.variant?.stock_quantity ?? (item.product as any).stock_quantity ?? null;
    const isOutOfStock = stockQty === 0;
    return !isOutOfStock;
  }).length;

  const isAllSelected = selectedItems.size === inStockItemsCount && inStockItemsCount > 0;

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
          const itemKey = `${item.product.id}-${item.variant?.id || 'default'}`;
          const isSelected = selectedItems.has(itemKey);

          // Check if out of stock
          const stockQty = item.variant?.stock_quantity ?? (item.product as any).stock_quantity ?? null;
          const isOutOfStock = stockQty === 0;

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
              key={itemKey}
              style={[styles.cartItem, isOutOfStock && styles.cartItemDisabled]}
            >
              {/* Checkbox - only for in-stock items */}
              {!isOutOfStock ? (
                <Pressable
                  style={styles.checkboxContainer}
                  onPress={() => toggleItemSelection(itemKey)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <MaterialIcons name='check' size={16} color='#FFFFFF' />
                    )}
                  </View>
                </Pressable>
              ) : (
                <View style={styles.checkboxPlaceholder} />
              )}

              {/* Product Image with Out of Stock Badge */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUrl || 'https://via.placeholder.com/100' }}
                  style={[styles.itemImage, isOutOfStock && styles.itemImageDisabled]}
                  contentFit='cover'
                />
                {isOutOfStock && (
                  <View style={styles.outOfStockBadge}>
                    <Typography variant='text' size='xs' weight='semiBold' style={styles.outOfStockText}>
                      Hết hàng
                    </Typography>
                  </View>
                )}
              </View>

              <View style={styles.itemInfo}>
                <Typography
                  variant='text'
                  size='md'
                  weight='medium'
                  numberOfLines={2}
                  style={isOutOfStock && styles.textDisabled}
                >
                  {item.product.name}
                </Typography>
                {variantName && (
                  <View style={styles.variantBadge}>
                    <Typography variant='text' size='xs' style={styles.variantBadgeText}>
                      {variantName}
                    </Typography>
                  </View>
                )}
                <Typography
                  variant='text'
                  size='md'
                  weight='bold'
                  style={[styles.itemPrice, isOutOfStock && styles.textDisabled]}
                >
                  {priceFormatted.vnd}
                </Typography>

                {/* Actions - Quantity controls or just delete button for out of stock */}
                <View style={styles.itemActions}>
                  {!isOutOfStock ? (
                    <View style={styles.quantityControls}>
                      <Pressable
                        style={styles.quantityButton}
                        onPress={() =>
                          updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)
                        }
                      >
                        <Feather name='minus' size={16} color='#FFFFFF' />
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
                        <Feather name='plus' size={16} color='#FFFFFF' />
                      </Pressable>
                    </View>
                  ) : (
                    <View />
                  )}
                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeItem(item.product.id, item.variant?.id)}
                  >
                    <Feather name='trash-2' size={22} color={theme.colors.text.tertiary} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

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
        <Pressable
          style={[styles.checkoutButton, { backgroundColor: selectedItems.size > 0 ? '#2E8FF9' : '#D1D5DB' }]}
          onPress={() => router.push('/checkout')}
          disabled={selectedItems.size === 0}
        >
          <View style={styles.checkoutGradient}>
            <Typography variant='text' size='md' weight='bold' style={styles.checkoutText}>
              {t('cart.checkout')}
            </Typography>
            <Feather name='arrow-right' size={20} color='#FFF' />
          </View>
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
      alignItems: 'flex-start',
    },
    cartItemDisabled: {
      opacity: 0.8,
    },
    checkboxContainer: {
      marginRight: 8,
      paddingTop: 30,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#D1D5DB',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
    checkboxSelected: {
      backgroundColor: '#2E8FF9',
      borderColor: '#2E8FF9',
    },
    checkboxPlaceholder: {
      width: 24,
      marginRight: 8,
    },
    imageContainer: {
      position: 'relative',
    },
    itemImage: {
      width: 100,
      height: 100,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
    },
    itemImageDisabled: {
      opacity: 0.6,
    },
    outOfStockBadge: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingVertical: 4,
      alignItems: 'center',
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    outOfStockText: {
      color: '#FFFFFF',
    },
    textDisabled: {
      color: theme.colors.text.tertiary,
    },
    itemInfo: {
      flex: 1,
      marginLeft: 12,
    },
    variantName: {
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    variantBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginTop: 4,
    },
    variantBadgeText: {
      color: theme.colors.text.secondary,
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
      gap: 8,
    },
    quantityButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: '#2E8FF9',
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
