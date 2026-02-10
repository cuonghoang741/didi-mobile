import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
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
  Modal,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Typography } from '@/components';
import { useTheme, useLanguage, useCart, useAuth } from '@/contexts';
import { createOrder, CheckoutForm } from '@/services/supabase/orderService';
import type { PaymentMethod } from '@/models/common';
import { supabase } from '@/services/supabase';
import { uploadImage } from '@/services/imageUpload';
import { useCurrency, useSettings } from '@/hooks';

// Type helper
const db = supabase as any;

interface Address {
  id: string;
  full_name: string;
  nickname?: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  ward?: string;
  district?: string;
  city: string;
  province?: string;
  postal_code?: string;
  is_default: boolean;
  type: string;
}

const PAYMENT_METHODS: { id: PaymentMethod; labelKey: string; descKey: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'daibiki', labelKey: 'checkout.daibiki', descKey: 'checkout.daibikiDesc', icon: 'truck' },
  { id: 'bank_transfer', labelKey: 'checkout.bankTransfer', descKey: 'checkout.bankTransferDesc', icon: 'credit-card' },
  { id: 'at_store', labelKey: 'checkout.atStore', descKey: 'checkout.atStoreDesc', icon: 'home' },
];

const CheckoutScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { items: allItems, getSubtotal, clearCart, removeItem } = useCart();
  const { user } = useAuth();
  const { formatPrice, formatJpy } = useCurrency();
  const { bankAccounts } = useSettings();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('daibiki');
  const [useDidiPoint, setUseDidiPoint] = useState(false);
  const [didiPoints] = useState(3); // Mock points

  // Selected cart items from cart page
  const [selectedCartItemKeys, setSelectedCartItemKeys] = useState<string[]>([]);

  // Payment proof states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ id: string; order_number: string } | null>(null);

  // Voucher state
  const [selectedVoucher, setSelectedVoucher] = useState<{
    id: string;
    code: string;
    title: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_discount?: number;
  } | null>(null);

  // Time slot state
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('Tất cả khung giờ');

  // Load selected cart items on mount
  useEffect(() => {
    const loadSelectedItems = async () => {
      try {
        const selectedData = await AsyncStorage.getItem('selectedCartItems');
        if (selectedData) {
          setSelectedCartItemKeys(JSON.parse(selectedData));
          // Clear from storage
          await AsyncStorage.removeItem('selectedCartItems');
        }
      } catch (error) {
        console.error('Error loading selected items:', error);
      }
    };
    loadSelectedItems();
  }, []);

  // Load time slot when screen focuses
  useFocusEffect(
    useCallback(() => {
      const loadTimeSlot = async () => {
        try {
          const savedLabel = await AsyncStorage.getItem('selected_time_slot_label');
          if (savedLabel) {
            setSelectedTimeSlot(savedLabel);
          }
        } catch (error) {
          console.error('Error loading time slot:', error);
        }
      };
      loadTimeSlot();
    }, [])
  );

  // Filter items based on selected keys
  const items = allItems.filter(item => {
    const itemKey = `${item.product.id}-${item.variant?.id || 'default'}`;
    // If no selected keys (direct access to checkout), show all
    if (selectedCartItemKeys.length === 0) return true;
    return selectedCartItemKeys.includes(itemKey);
  });

  // Calculate subtotal for selected items only
  const subtotal = items.reduce((total, item) => {
    const price = item.variant?.price || item.product?.sale_price || item.product?.base_price || 0;
    return total + (price * item.quantity);
  }, 0);
  const shipping = paymentMethod === 'at_store' ? 0 : 500;

  // Calculate discount based on selected voucher
  const calculateDiscount = (): number => {
    if (!selectedVoucher) return 0;

    if (selectedVoucher.discount_type === 'percentage') {
      const percentDiscount = Math.floor(subtotal * (selectedVoucher.discount_value / 100));
      // Apply max discount cap if exists
      if (selectedVoucher.max_discount) {
        return Math.min(percentDiscount, selectedVoucher.max_discount);
      }
      return percentDiscount;
    } else {
      // Fixed discount
      return selectedVoucher.discount_value;
    }
  };

  const discount = calculateDiscount();
  const total = subtotal + shipping - discount;

  // Fetch default address
  const fetchDefaultAddress = useCallback(async () => {
    if (!user?.id) {
      setLoadingAddress(false);
      return;
    }

    try {
      const { data, error } = await db
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setSelectedAddress(data[0]);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    } finally {
      setLoadingAddress(false);
    }
  }, [user?.id]);

  // Refresh address when screen is focused (after selecting/editing)
  useFocusEffect(
    useCallback(() => {
      fetchDefaultAddress();
      loadSelectedVoucher();
    }, [fetchDefaultAddress])
  );

  // Load selected voucher from AsyncStorage
  const loadSelectedVoucher = async () => {
    try {
      const voucherData = await AsyncStorage.getItem('selectedVoucher');
      if (voucherData) {
        const voucher = JSON.parse(voucherData);
        setSelectedVoucher(voucher);
        // Clear the stored voucher after loading
        await AsyncStorage.removeItem('selectedVoucher');
      }
    } catch (error) {
      console.error('Error loading voucher:', error);
    }
  };

  const handleSelectAddress = () => {
    router.push('/addresses?select=true' as any);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      if (paymentMethod === 'at_store') {
        Alert.alert(t('common.notice'), t('checkout.selectRecipientForPickup'));
      } else {
        Alert.alert(t('common.notice'), t('checkout.selectAddressRequired'));
      }
      return;
    }
    if (!user) {
      Alert.alert(t('common.notice'), t('checkout.loginRequired'));
      return;
    }

    setLoading(true);

    try {
      const form: CheckoutForm = {
        shipping_name: selectedAddress.full_name,
        shipping_phone: selectedAddress.phone,
        shipping_email: '',
        shipping_address: selectedAddress.address_line1,
        shipping_city: selectedAddress.city || selectedAddress.province || '',
        shipping_district: selectedAddress.district || '',
        shipping_ward: selectedAddress.ward || '',
        shipping_note: customerNote,
        payment_method: paymentMethod,
      };

      const { order, error } = await createOrder(user.id.toString(), items, form);

      if (error || !order) {
        Alert.alert('Lỗi', error || 'Không thể tạo đơn hàng');
        return;
      }

      // Remove only ordered items from cart (not all cart items)
      const removeOrderedItems = () => {
        items.forEach(item => {
          removeItem(item.product.id, item.variant?.id);
        });
      };

      if (paymentMethod === 'bank_transfer') {
        removeOrderedItems();
        // Navigate to bank transfer confirmation screen
        router.replace({
          pathname: '/bank-transfer-confirm',
          params: {
            orderId: order.id,
            orderNumber: order.order_number,
            totalAmount: total.toString(),
          },
        } as any);
      } else {
        removeOrderedItems();
        router.replace({
          pathname: '/order-success',
          params: { orderId: order.id, orderNumber: order.order_number },
        });
      }
    } catch (err) {
      console.error('Order error:', err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  // Copy bank account number
  const handleCopyAccount = async (accountNumber: string) => {
    await Clipboard.setStringAsync(accountNumber);
    Alert.alert(t('checkout.copied'), t('checkout.accountCopied'));
  };

  // Pick payment proof image
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const actions: any[] = [];
      if (asset.width > 1500 || asset.height > 2000) {
        if (asset.width / asset.height > 1500 / 2000) {
          actions.push({ resize: { width: 1500 } });
        } else {
          actions.push({ resize: { height: 2000 } });
        }
      }

      const manipulatedImage = await manipulateAsync(
        asset.uri,
        actions,
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      setPaymentProofImage(manipulatedImage.uri);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.error'), 'Cần cấp quyền camera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const actions: any[] = [];
      if (asset.width > 1500 || asset.height > 2000) {
        if (asset.width / asset.height > 1500 / 2000) {
          actions.push({ resize: { width: 1500 } });
        } else {
          actions.push({ resize: { height: 2000 } });
        }
      }

      const manipulatedImage = await manipulateAsync(
        asset.uri,
        actions,
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      setPaymentProofImage(manipulatedImage.uri);
    }
  };



  const handleConfirmPayment = async () => {
    if (!paymentProofImage) {
      Alert.alert(t('common.error'), 'Vui lòng tải lên ảnh chuyển khoản');
      return;
    }
    if (!pendingOrder) return;

    setUploadingProof(true);
    try {
      const uploadedUrl = await uploadImage(paymentProofImage);

      if (!uploadedUrl) {
        Alert.alert(t('common.error'), 'Không thể tải ảnh lên. Vui lòng thử lại');
        return;
      }

      // TODO: Update order with payment proof URL if backend supports it
      // For now we just pass it to success screen or assume it's handled

      setShowPaymentModal(false);
      router.replace({
        pathname: '/order-success',
        params: {
          orderId: pendingOrder.id,
          orderNumber: pendingOrder.order_number,
          pendingPayment: 'true',
          paymentProofUrl: uploadedUrl
        },
      });
    } catch (error) {
      console.error('Error in payment confirmation:', error);
      Alert.alert(t('common.error'), 'Đã có lỗi xảy ra');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSkipPaymentProof = () => {
    if (!pendingOrder) return;
    setShowPaymentModal(false);
    router.replace({
      pathname: '/order-success',
      params: {
        orderId: pendingOrder.id,
        orderNumber: pendingOrder.order_number,
        pendingPayment: 'true',
      },
    });
  };

  const renderAddressSection = () => {
    if (loadingAddress) {
      return (
        <View style={styles.sectionCard}>
          <ActivityIndicator size="small" color={theme.colors.text.brand_primary} />
        </View>
      );
    }

    return (
      <View style={styles.sectionCard}>
        <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
          {t('checkout.shippingAddress')}
        </Typography>

        <Pressable style={styles.addressRow} onPress={handleSelectAddress}>
          <Feather name='map-pin' size={18} color={theme.colors.text.secondary} />
          <Typography variant='text' size='md' style={styles.addressRowText}>
            {selectedAddress
              ? `${selectedAddress.full_name} - ${selectedAddress.phone}`
              : t('checkout.selectAddress')}
          </Typography>
          <Feather name='chevron-right' size={20} color={theme.colors.text.tertiary} />
        </Pressable>

        <Pressable style={[styles.addressRow, { borderBottomWidth: 0 }]} onPress={() => router.push('/select-time-slot')}>
          <Feather name='clock' size={18} color={theme.colors.text.secondary} />
          <Typography variant='text' size='md' style={styles.addressRowText}>
            {selectedTimeSlot}
          </Typography>
          <Feather name='chevron-right' size={20} color={theme.colors.text.tertiary} />
        </Pressable>
      </View>
    );
  };

  const renderProductsSection = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Feather name='shopping-bag' size={18} color={theme.colors.text.primary} />
        <Typography variant='text' size='md' weight='bold' style={{ marginLeft: 8 }}>
          {t('checkout.products')}
        </Typography>
      </View>

      {items.map((item) => (
        <View key={item.id || `${item.product.id}-${item.variant?.id || 'default'}`} style={styles.productRow}>
          <Image
            source={{ uri: item.product?.thumbnail_url || item.product?.image_urls?.[0] }}
            style={styles.productImage}
            contentFit='cover'
          />
          <View style={styles.productInfo}>
            <Typography variant='text' size='md' numberOfLines={2}>
              {item.product?.name}
            </Typography>
            <Typography variant='text' size='sm' style={styles.quantityText}>
              x{item.quantity}
            </Typography>
          </View>
          <Typography variant='text' size='md' weight='bold' style={styles.priceText}>
            {formatJpy(item.variant?.price || item.product?.sale_price || item.product?.base_price || 0)}
          </Typography>
        </View>
      ))}
    </View>
  );

  const renderShippingSection = () => (
    <View style={styles.sectionCard}>
      <View style={styles.shippingRow}>
        <Typography variant='text' size='md' weight='bold'>
          {t('checkout.shipping')}
        </Typography>
      </View>
      <View style={styles.shippingSecurityInfo}>
        <Feather name='shield' size={16} color={theme.colors.text.tertiary} />
        <Typography variant='text' size='sm' style={styles.shippingText}>
          {t('checkout.securityNote')}
        </Typography>
      </View>
    </View>
  );

  const handleSelectVoucher = () => {
    router.push({
      pathname: '/select-voucher',
      params: { orderTotal: subtotal.toString() },
    } as any);
  };

  const handleRemoveVoucher = () => {
    setSelectedVoucher(null);
  };

  const renderVoucherSection = () => (
    <View style={styles.sectionCard}>
      <Pressable style={styles.voucherRow} onPress={handleSelectVoucher}>
        <Feather name='tag' size={18} color={theme.colors.text.secondary} />
        <Typography variant='text' size='md' weight='bold' style={{ flex: 1, marginLeft: 12 }}>
          {t('checkout.voucher')}
        </Typography>
        {selectedVoucher ? (
          <View style={styles.selectedVoucherContainer}>
            <Typography variant='text' size='sm' style={styles.voucherValue}>
              {selectedVoucher.discount_type === 'percentage'
                ? `Giảm ${selectedVoucher.discount_value}%`
                : `Giảm ¥${selectedVoucher.discount_value}`
              }
            </Typography>
            <Pressable onPress={handleRemoveVoucher} hitSlop={8}>
              <Feather name='x-circle' size={18} color={theme.colors.text.tertiary} />
            </Pressable>
          </View>
        ) : (
          <>
            <Typography variant='text' size='sm' style={styles.selectVoucherText}>
              {t('checkout.selectVoucher')}
            </Typography>
            <Feather name='chevron-right' size={20} color={theme.colors.text.tertiary} />
          </>
        )}
      </Pressable>
    </View>
  );

  const renderPointsSection = () => (
    <View style={styles.sectionCard}>
      <View style={styles.pointsRow}>
        <Feather name='gift' size={18} color={theme.colors.text.secondary} />
        <View style={styles.pointsInfo}>
          <Typography variant='text' size='md' weight='bold'>
            DiDi Point
          </Typography>
          <View style={styles.pointsBalance}>
            <Typography variant='text' size='sm' style={styles.pointsText}>
              {t('checkout.points')}: {didiPoints}
            </Typography>
            <View style={styles.pointIcon}>
              <Typography variant='text' size='xs' style={{ color: '#F59E0B' }}>●</Typography>
            </View>
          </View>
        </View>
        <Switch
          value={useDidiPoint}
          onValueChange={setUseDidiPoint}
          trackColor={{ false: '#E5E7EB', true: theme.colors.foreground.brand_primary }}
          thumbColor='#FFFFFF'
        />
      </View>
    </View>
  );

  const renderNoteSection = () => (
    <View style={styles.sectionCard}>
      <View style={styles.noteHeader}>
        <Feather name='file-text' size={18} color={theme.colors.text.secondary} />
        <Typography variant='text' size='md' weight='bold' style={{ marginLeft: 8 }}>
          {t('checkout.note')}
        </Typography>
      </View>
      <TextInput
        style={styles.noteInput}
        placeholder={t('checkout.enterNote')}
        placeholderTextColor={theme.colors.text.tertiary}
        value={customerNote}
        onChangeText={setCustomerNote}
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderSummarySection = () => (
    <View style={styles.sectionCard}>
      <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
        {t('checkout.summary')}
      </Typography>

      <View style={styles.summaryRow}>
        <Typography variant='text' size='md' style={styles.summaryLabel}>
          {t('checkout.subtotal')}
        </Typography>
        <Typography variant='text' size='md'>
          {formatJpy(subtotal)}
        </Typography>
      </View>

      {discount > 0 && (
        <View style={styles.summaryRow}>
          <Typography variant='text' size='md' style={styles.summaryLabel}>
            {t('checkout.discount')}
          </Typography>
          <Typography variant='text' size='md' style={styles.discountText}>
            -{formatJpy(discount)}
          </Typography>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.summaryRow}>
        <Typography variant='text' size='lg' weight='bold'>
          {t('checkout.total')}
        </Typography>
        <Typography variant='text' size='lg' weight='bold' style={styles.totalText}>
          {formatJpy(total)}
        </Typography>
      </View>
    </View>
  );

  const renderPaymentSection = () => (
    <View style={styles.sectionCard}>
      <Typography variant='text' size='md' weight='bold' style={styles.sectionTitle}>
        {t('checkout.paymentMethod')}
      </Typography>

      {PAYMENT_METHODS.map((method, index) => {
        const isSelected = paymentMethod === method.id;
        const isLast = index === PAYMENT_METHODS.length - 1;
        return (
          <Pressable
            key={method.id}
            style={[
              styles.paymentRow,
              isSelected && styles.paymentRowActive,
              isLast && { borderBottomWidth: 0 }
            ]}
            onPress={() => setPaymentMethod(method.id)}
          >
            <View style={[styles.paymentIcon, isSelected && styles.paymentIconActive]}>
              <Feather name={method.icon} size={20} color={isSelected ? '#FFFFFF' : theme.colors.text.secondary} />
            </View>
            <View style={styles.paymentInfo}>
              <Typography variant='text' size='md' weight={isSelected ? 'semiBold' : 'regular'}>
                {t(method.labelKey)}
              </Typography>
              <Typography variant='text' size='sm' style={styles.paymentDesc}>
                {t(method.descKey)}
              </Typography>
            </View>
            <View style={[
              styles.radioOuter,
              isSelected && styles.radioOuterActive,
            ]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        );
      })}

      {/* Bank Account Info */}
      {paymentMethod === 'bank_transfer' && bankAccounts.length > 0 && (
        <View style={styles.bankSection}>
          <Typography variant='text' size='sm' weight='medium' style={{ marginBottom: 12 }}>
            {t('checkout.transferTo')}
          </Typography>
          {bankAccounts.map((account) => (
            <View key={account.id} style={styles.bankCard}>
              <View style={styles.bankHeader}>
                <Feather name='credit-card' size={18} color={theme.colors.text.brand_primary} />
                <Typography variant='text' size='md' weight='bold' style={{ marginLeft: 8 }}>
                  {account.bank_name}
                </Typography>
              </View>
              <View style={styles.bankRow}>
                <Typography variant='text' size='sm' style={styles.bankLabel}>
                  {t('checkout.accountNumber')}
                </Typography>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopyAccount(account.account_number)}
                >
                  <Typography variant='text' size='sm' weight='bold' style={styles.accountNumber}>
                    {account.account_number}
                  </Typography>
                  <Feather name='copy' size={14} color={theme.colors.text.brand_primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

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
          {renderAddressSection()}
          {renderProductsSection()}
          {renderShippingSection()}
          {renderVoucherSection()}
          {renderPointsSection()}
          {renderNoteSection()}
          {renderSummarySection()}
          {renderPaymentSection()}
          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={[styles.orderButton, loading && styles.orderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <LinearGradient
            colors={['#0088FF', '#0088FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderGradient}
          >
            {loading ? (
              <ActivityIndicator color='#FFF' />
            ) : (
              <Typography variant='text' size='md' weight='bold' style={styles.orderText}>
                {t('checkout.placeOrder')} • {formatJpy(total)}
              </Typography>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {/* Payment Proof Modal */}
      <Modal
        visible={showPaymentModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => { }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Typography variant='text' size='lg' weight='bold'>
              {t('checkout.paymentProof')}
            </Typography>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {bankAccounts.map((account) => (
              <View key={account.id} style={styles.bankCard}>
                <View style={styles.bankHeader}>
                  <Feather name='credit-card' size={18} color={theme.colors.text.brand_primary} />
                  <Typography variant='text' size='md' weight='bold' style={{ marginLeft: 8 }}>
                    {account.bank_name}
                  </Typography>
                </View>
                <View style={styles.bankRow}>
                  <Typography variant='text' size='sm' style={styles.bankLabel}>
                    {t('checkout.accountNumber')}
                  </Typography>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopyAccount(account.account_number)}
                  >
                    <Typography variant='text' size='sm' weight='bold' style={styles.accountNumber}>
                      {account.account_number}
                    </Typography>
                    <Feather name='copy' size={14} color={theme.colors.text.brand_primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.modalSection}>
              <Typography variant='text' size='md' weight='medium'>
                {t('checkout.uploadProof')}
              </Typography>
              {paymentProofImage ? (
                <View style={styles.proofImageContainer}>
                  <Image source={{ uri: paymentProofImage }} style={styles.proofImage} contentFit='cover' />
                  <Pressable style={styles.removeImageButton} onPress={() => setPaymentProofImage(null)}>
                    <Feather name='x' size={20} color='#FFF' />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.uploadButtons}>
                  <Pressable style={styles.uploadButton} onPress={handlePickImage}>
                    <Feather name='image' size={24} color={theme.colors.text.brand_primary} />
                    <Typography variant='text' size='sm' style={{ marginTop: 8 }}>Thư viện</Typography>
                  </Pressable>
                  <Pressable style={styles.uploadButton} onPress={handleTakePhoto}>
                    <Feather name='camera' size={24} color={theme.colors.text.brand_primary} />
                    <Typography variant='text' size='sm' style={{ marginTop: 8 }}>Chụp ảnh</Typography>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalBottomBar}>
            <Pressable style={styles.skipButton} onPress={handleSkipPaymentProof}>
              <Typography variant='text' size='md'>Để sau</Typography>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, uploadingProof && { opacity: 0.6 }]}
              onPress={handleConfirmPayment}
              disabled={uploadingProof}
            >
              <LinearGradient colors={['#0088FF', '#0088FF']} style={styles.confirmGradient}>
                {uploadingProof ? (
                  <ActivityIndicator color='#FFF' />
                ) : (
                  <Typography variant='text' size='md' weight='bold' style={{ color: '#FFF' }}>
                    Xác nhận
                  </Typography>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    backButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    sectionCard: {
      backgroundColor: 'white',
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderRadius: 16,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    // Address Section
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    addressRowText: {
      flex: 1,
      marginLeft: 12,
      color: theme.colors.text.primary,
    },
    // Products Section
    productRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    productImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
    },
    productInfo: {
      flex: 1,
      marginLeft: 12,
    },
    quantityText: {
      color: theme.colors.text.tertiary,
      marginTop: 4,
    },
    priceText: {
      color: theme.colors.text.price,
    },
    // Shipping Section
    shippingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    shippingSecurityInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 6,
    },
    shippingInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    shippingText: {
      color: theme.colors.text.tertiary,
      flex: 1,
    },
    // Voucher Section
    voucherRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    voucherValue: {
      color: theme.colors.text.brand_primary,
      marginRight: 8,
    },
    selectedVoucherContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    selectVoucherText: {
      color: theme.colors.text.tertiary,
      marginRight: 4,
    },
    // Points Section
    pointsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pointsInfo: {
      flex: 1,
      marginLeft: 12,
    },
    pointsBalance: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    pointsText: {
      color: theme.colors.text.tertiary,
    },
    pointIcon: {
      marginLeft: 4,
    },
    // Note Section
    noteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    noteInput: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      padding: 12,
      minHeight: 80,
      fontSize: 14,
      color: theme.colors.text.primary,
      textAlignVertical: 'top',
    },
    // Summary Section
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    summaryLabel: {
      color: theme.colors.text.secondary,
    },
    discountText: {
      color: '#EF4444',
    },
    totalText: {
      color: '#3B82F6',
    },
    divider: {
      height: 1,
      backgroundColor: '#E5E7EB',
      marginVertical: 8,
    },
    // Payment Section
    paymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
      gap: 12,
    },
    paymentRowActive: {
      backgroundColor: 'rgba(46, 143, 249, 0.05)',
      marginHorizontal: -16,
      paddingHorizontal: 16,
    },
    paymentIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    paymentIconActive: {
      backgroundColor: '#2E8FF9',
    },
    paymentInfo: {
      flex: 1,
    },
    paymentDesc: {
      color: theme.colors.text.tertiary,
      marginTop: 2,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#D1D5DB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioOuterActive: {
      borderColor: theme.colors.text.brand_primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.text.brand_primary,
    },
    bankSection: {
      marginTop: 16,
      padding: 12,
      backgroundColor: '#FFF7ED',
      borderRadius: 8,
    },
    bankCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    bankHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    bankRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bankLabel: {
      color: theme.colors.text.tertiary,
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    accountNumber: {
      color: theme.colors.text.brand_primary,
    },
    // Bottom Bar
    bottomBar: {
      padding: 16,
      backgroundColor: theme.colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    orderButton: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    orderButtonDisabled: {
      opacity: 0.6,
    },
    orderGradient: {
      paddingVertical: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    orderText: {
      color: '#FFFFFF',
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    modalHeader: {
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    modalContent: {
      flex: 1,
      padding: 16,
    },
    modalSection: {
      marginTop: 16,
    },
    proofImageContainer: {
      marginTop: 12,
      borderRadius: 12,
      overflow: 'hidden',
    },
    proofImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    uploadButton: {
      flex: 1,
      height: 100,
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBottomBar: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      paddingBottom: 32,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    skipButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmButton: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    confirmGradient: {
      paddingVertical: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default CheckoutScreen;
