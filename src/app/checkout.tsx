import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography } from '@/components';
import { useTheme, useLanguage, useCart, useAuth } from '@/contexts';
import { createOrder } from '@/services/supabase';
import type { PaymentMethod, CheckoutForm } from '@/types/database.types';

import { useCurrency } from '@/hooks';

const PAYMENT_METHODS: { id: PaymentMethod; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'at_store', icon: 'home' },
  { id: 'bank_transfer', icon: 'credit-card' },
  { id: 'daibiki', icon: 'truck' },
];

const CheckoutScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { items, getSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    shipping_name: '',
    shipping_phone: '',
    shipping_email: '',
    shipping_address: '',
    shipping_city: '',
    shipping_district: '',
    shipping_ward: '',
    shipping_note: '',
    payment_method: 'daibiki',
  });

  const subtotal = getSubtotal();
  const shipping = form.payment_method === 'at_store' ? 0 : 500; // 500 JPY shipping
  const total = subtotal + shipping;

  const subtotalFormatted = formatPrice(subtotal);
  const shippingFormatted = formatPrice(shipping);
  const totalFormatted = formatPrice(total);

  const [zipCode, setZipCode] = useState('');
  const [loadingZip, setLoadingZip] = useState(false);

  const handleZipCodeChange = async (text: string) => {
    setZipCode(text);

    if (text.length === 7) {
      setLoadingZip(true);
      try {
        const response = await fetch(`https://api.zipaddress.net/?zipcode=${text}&lang=rome`);
        const result = await response.json();

        if (result.code === 200 && result.data) {
          const { pref, address } = result.data;
          // Auto-fill address
          setForm((prev) => ({
            ...prev,
            shipping_city: pref || prev.shipping_city,
            shipping_district: address || prev.shipping_district,
            shipping_ward: '', // Reset or try to parse if needed
          }));
        }
      } catch (error) {
        console.error('Error fetching address:', error);
      } finally {
        setLoadingZip(false);
      }
    }
  };

  const updateForm = (key: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.shipping_name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return false;
    }
    if (!form.shipping_phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return false;
    }
    if (form.payment_method !== 'at_store') {
      if (!form.shipping_address.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ giao hàng');
        return false;
      }
      if (!form.shipping_city.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tỉnh/thành phố');
        return false;
      }
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để đặt hàng');
      return;
    }

    setLoading(true);

    try {
      const { order, error } = await createOrder(user.id.toString(), items, form);

      if (error || !order) {
        Alert.alert('Lỗi', error || 'Không thể tạo đơn hàng');
        return;
      }

      clearCart();
      router.replace({
        pathname: '/order-success',
        params: { orderId: order.id, orderNumber: order.order_number },
      });
    } catch (err) {
      console.error('Order error:', err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    switch (method) {
      case 'at_store':
        return t('checkout.atStore');
      case 'bank_transfer':
        return t('checkout.bankTransfer');
      case 'daibiki':
        return t('checkout.daibiki');
      default:
        return '';
    }
  };

  const getPaymentMethodDesc = (method: PaymentMethod): string => {
    switch (method) {
      case 'at_store':
        return t('checkout.atStoreDesc');
      case 'bank_transfer':
        return t('checkout.bankTransferDesc');
      case 'daibiki':
        return t('checkout.daibikiDesc');
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
        </Pressable>
        <Typography variant='text' size='lg' weight='bold'>
          {t('checkout.title')}
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Shipping Info */}
          <View style={styles.section}>
            <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
              {t('checkout.shippingInfo')}
            </Typography>

            <View style={styles.inputGroup}>
              <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                {t('checkout.fullName')} *
              </Typography>
              <TextInput
                style={styles.input}
                placeholder={t('checkout.fullName')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={form.shipping_name}
                onChangeText={(v) => updateForm('shipping_name', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                {t('checkout.phone')} *
              </Typography>
              <TextInput
                style={styles.input}
                placeholder={t('checkout.phone')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={form.shipping_phone}
                onChangeText={(v) => updateForm('shipping_phone', v)}
                keyboardType='phone-pad'
              />
            </View>

            <View style={styles.inputGroup}>
              <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                {t('checkout.email')}
              </Typography>
              <TextInput
                style={styles.input}
                placeholder={t('checkout.email')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={form.shipping_email}
                onChangeText={(v) => updateForm('shipping_email', v)}
                keyboardType='email-address'
                autoCapitalize='none'
              />
            </View>

            {form.payment_method !== 'at_store' && (
              <>
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                      {t('checkout.zipCode')}
                    </Typography>
                    {loadingZip && (
                      <ActivityIndicator size='small' color={theme.colors.text.brand_primary} />
                    )}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder='1000001'
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={zipCode}
                    onChangeText={handleZipCodeChange}
                    keyboardType='numeric'
                    maxLength={7}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                    {t('checkout.address')} *
                  </Typography>
                  <TextInput
                    style={styles.input}
                    placeholder={t('checkout.address')}
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={form.shipping_address}
                    onChangeText={(v) => updateForm('shipping_address', v)}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                      {t('checkout.city')} *
                    </Typography>
                    <TextInput
                      style={styles.input}
                      placeholder={t('checkout.city')}
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={form.shipping_city}
                      onChangeText={(v) => updateForm('shipping_city', v)}
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                      {t('checkout.district')}
                    </Typography>
                    <TextInput
                      style={styles.input}
                      placeholder={t('checkout.district')}
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={form.shipping_district}
                      onChangeText={(v) => updateForm('shipping_district', v)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                    {t('checkout.ward')}
                  </Typography>
                  <TextInput
                    style={styles.input}
                    placeholder={t('checkout.ward')}
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={form.shipping_ward}
                    onChangeText={(v) => updateForm('shipping_ward', v)}
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Typography variant='text' size='sm' weight='medium' style={styles.label}>
                {t('checkout.note')}
              </Typography>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('checkout.note')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={form.shipping_note}
                onChangeText={(v) => updateForm('shipping_note', v)}
                multiline
                numberOfLines={3}
                textAlignVertical='top'
              />
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
              {t('checkout.paymentMethod')}
            </Typography>

            {PAYMENT_METHODS.map((method) => (
              <Pressable
                key={method.id}
                style={[
                  styles.paymentOption,
                  form.payment_method === method.id && styles.paymentOptionActive,
                ]}
                onPress={() => updateForm('payment_method', method.id)}
              >
                <View style={styles.paymentRadio}>
                  <View
                    style={[
                      styles.radioOuter,
                      form.payment_method === method.id && styles.radioOuterActive,
                    ]}
                  >
                    {form.payment_method === method.id && <View style={styles.radioInner} />}
                  </View>
                </View>
                <View style={styles.paymentIcon}>
                  <Feather name={method.icon} size={20} color={theme.colors.text.brand_primary} />
                </View>
                <View style={styles.paymentInfo}>
                  <Typography variant='text' size='md' weight='medium'>
                    {getPaymentMethodLabel(method.id)}
                  </Typography>
                  <Typography variant='text' size='sm' style={styles.paymentDesc}>
                    {getPaymentMethodDesc(method.id)}
                  </Typography>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
              {t('checkout.orderSummary')}
            </Typography>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Typography variant='text' size='md' style={styles.summaryLabel}>
                  {t('cart.subtotal')} ({items.length} {t('cart.itemCount')})
                </Typography>
                <View style={{ alignItems: 'flex-end' }}>
                  <Typography variant='text' size='md' weight='medium'>
                    {subtotalFormatted.jpy}
                  </Typography>
                  <Typography
                    variant='text'
                    size='xs'
                    style={{ color: theme.colors.text.tertiary }}
                  >
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
                    {shipping === 0 ? t('checkout.freeShipping') : shippingFormatted.jpy}
                  </Typography>
                  {shipping > 0 && (
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
                  <Typography
                    variant='text'
                    size='sm'
                    style={{ color: theme.colors.text.tertiary }}
                  >
                    {totalFormatted.vnd}
                  </Typography>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

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
          style={[styles.orderButton, loading && styles.orderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <LinearGradient
            colors={['#5B7CFF', '#3D4DF4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderGradient}
          >
            {loading ? (
              <ActivityIndicator color='#FFF' />
            ) : (
              <>
                <Typography variant='text' size='md' weight='bold' style={styles.orderText}>
                  {t('checkout.placeOrder')}
                </Typography>
                <Feather name='check' size={20} color='#FFF' />
              </>
            )}
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
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      marginBottom: 8,
      color: theme.colors.text.secondary,
    },
    input: {
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    textArea: {
      minHeight: 80,
      paddingTop: 14,
    },
    row: {
      flexDirection: 'row',
    },
    paymentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.secondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    paymentOptionActive: {
      borderColor: theme.colors.text.brand_primary,
      backgroundColor: '#EEF2FF',
    },
    paymentRadio: {
      marginRight: 12,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#D1D5DB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioOuterActive: {
      borderColor: theme.colors.text.brand_primary,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.text.brand_primary,
    },
    paymentIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#EEF2FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentDesc: {
      color: theme.colors.text.tertiary,
      marginTop: 2,
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
    orderButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    orderButtonDisabled: {
      opacity: 0.6,
    },
    orderGradient: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 14,
      gap: 8,
    },
    orderText: {
      color: '#FFFFFF',
    },
  });

export default CheckoutScreen;
