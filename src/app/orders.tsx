import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Typography, Button, AuthProtect, Skeleton } from '@/components';
import OrderReviewModal from '@/components/order/OrderReviewModal';
import { useTheme, useLanguage, useAuth } from '@/contexts';
import { fetchUserOrders } from '@/services/supabase/orderService';
import { Order, OrderItem } from '@/types/database.types';

const EmptyStateImage = require('@/assets/images/empty-state.png');

type OrderWithItems = Order & { items: OrderItem[] };

const OrderStatusTab = ({
  status,
  isActive,
  onPress,
  label,
}: {
  status: string;
  isActive: boolean;
  onPress: () => void;
  label: string;
}) => {
  const theme = useTheme();
  return (
    <Pressable
      style={[styles.tab, isActive && { borderBottomColor: theme.colors.foreground.brand_primary }]}
      onPress={onPress}
    >
      <Typography
        variant='text'
        size='md'
        weight={isActive ? 'bold' : 'medium'}
        style={{
          color: isActive ? theme.colors.foreground.brand_primary : theme.colors.text.secondary,
        }}
      >
        {label}
      </Typography>
    </Pressable>
  );
};

import { useCurrency } from '@/hooks';

const OrderItemCard = ({ order, onPress, onReview }: { order: OrderWithItems; onPress: () => void; onReview?: () => void }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency(); // Hook usage

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500'; // Orange
      case 'processing':
        return '#007AFF'; // Blue
      case 'shipping':
        return '#5856D6'; // Indigo
      case 'completed':
        return '#34C759'; // Green
      case 'cancelled':
        return '#FF3B30'; // Red
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return t('order.status.pending');
      case 'processing':
        return t('order.status.processing');
      case 'shipping':
        return t('order.status.shipping');
      case 'completed':
        return t('order.status.completed');
      case 'cancelled':
        return t('order.status.cancelled');
      default:
        return status;
    }
  };

  const firstItem = order.items?.[0];
  const totalAmount = formatPrice(order.total_amount);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Typography variant='text' size='sm' weight='medium'>
          {order.order_number}
        </Typography>
        <Typography
          variant='text'
          size='sm'
          weight='medium'
          style={{ color: getStatusColor(order.status) }}
        >
          {getStatusLabel(order.status)}
        </Typography>
      </View>

      <View style={styles.cardBody}>
        {firstItem && (
          <View style={styles.productRow}>
            <Image
              source={{ uri: firstItem.image_url || 'https://via.placeholder.com/80' }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Typography variant='text' size='md' numberOfLines={1}>
                {firstItem.product_name}
              </Typography>
              {firstItem.variant_name && (
                <Typography variant='text' size='sm' style={{ color: theme.colors.text.tertiary }}>
                  {t('common.variant')}: {firstItem.variant_name}
                </Typography>
              )}
              <View style={styles.quantityRow}>
                <Typography variant='text' size='sm'>
                  x{firstItem.quantity}
                </Typography>
                <Typography variant='text' size='sm' weight='bold'>
                  {formatPrice(firstItem.unit_price).jpy}
                </Typography>
              </View>
            </View>
          </View>
        )}

        {order.items.length > 1 && (
          <View style={styles.moreItems}>
            <Typography variant='text' size='xs' style={{ color: theme.colors.text.tertiary }}>
              {t('order.moreItems', { count: order.items.length - 1 })}
            </Typography>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.totalRow}>
          <Typography variant='text' size='sm' style={{ color: theme.colors.text.secondary }}>
            {t('order.totalAmount', {
              count: order.items.reduce((acc, item) => acc + item.quantity, 0),
            })}
            :
          </Typography>
          <View style={{ alignItems: 'flex-end' }}>
            <Typography
              variant='text'
              size='lg'
              weight='bold'
              style={{ color: theme.colors.text.brand_primary }}
            >
              {totalAmount.jpy}
            </Typography>
            <Typography variant='text' size='xs' style={{ color: theme.colors.text.tertiary }}>
              {totalAmount.vnd}
            </Typography>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {order.status === 'pending' && (
            <Button size='sm' variant='outline' colorScheme='error' onPress={() => { }}>
              {t('order.action.cancel')}
            </Button>
          )}
          {order.status === 'completed' && onReview && (
            <Button size='sm' variant='solid' colorScheme='brand' onPress={onReview}>
              {t('order.action.review')}
            </Button>
          )}
          <Button size='sm' variant='outline' colorScheme='gray' onPress={onPress}>
            {t('order.action.viewDetail')}
          </Button>
        </View>
      </View>
    </Pressable>
  );
};

const OrdersScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useLanguage();
  const { getUserId } = useAuth();
  const userId = getUserId();

  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const handleOpenReview = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setReviewModalVisible(true);
  };

  const handleCloseReview = () => {
    setReviewModalVisible(false);
    setSelectedOrder(null);
  };

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      const { orders: data } = await fetchUserOrders(userId, 1, 50);
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredOrders =
    activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab);

  const tabs = [
    { key: 'all', label: t('order.tab.all') },
    { key: 'pending', label: t('order.tab.pending') },
    { key: 'shipping', label: t('order.tab.shipping') },
    { key: 'completed', label: t('order.tab.completed') },
    { key: 'cancelled', label: t('order.tab.cancelled') },
  ];

  return (
    <AuthProtect>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name='arrow-left' size={24} color={theme.colors.text.primary} />
          </Pressable>
          <Typography variant='text' size='lg' weight='bold'>
            {t('order.historyTitle')}
          </Typography>
          <View style={styles.headerRight} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <FlatList
            data={tabs}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <OrderStatusTab
                status={item.key}
                label={item.label}
                isActive={activeTab === item.key}
                onPress={() => setActiveTab(item.key)}
              />
            )}
            contentContainerStyle={styles.tabsContent}
          />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={theme.colors.foreground.brand_primary} />
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderItemCard
                order={item}
                onPress={() => router.push(`/order/${item.id}`)}
                onReview={item.status === 'completed' ? () => handleOpenReview(item) : undefined}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Image source={EmptyStateImage} style={styles.emptyImage} resizeMode='contain' />
                <Typography variant='text' size='md' style={styles.emptyText}>
                  {t('order.empty')}
                </Typography>
                <Button
                  colorScheme='brand'
                  size='md'
                  variant='solid'
                  onPress={() => router.back()}
                  style={{ marginTop: 16 }}
                >
                  {t('common.continueShopping')}
                </Button>
              </View>
            }
          />
        )}

        {/* Review Modal */}
        {selectedOrder && (
          <OrderReviewModal
            visible={reviewModalVisible}
            onClose={handleCloseReview}
            orderId={selectedOrder.id}
            items={selectedOrder.items}
            onReviewSubmitted={fetchData}
          />
        )}
      </SafeAreaView>
    </AuthProtect>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7', // theme.colors.background.primary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabsContent: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  cardBody: {
    marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  moreItems: {
    marginTop: 8,
    alignItems: 'center',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyImage: {
    width: 180,
    height: 180,
  },
  emptyText: {
    color: '#8E8E93',
    marginTop: 16,
  },
});

export default OrdersScreen;
