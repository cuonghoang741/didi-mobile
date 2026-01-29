import { supabase } from './client';
import type {
  Order,
  OrderItem,
  InsertTables,
  CheckoutForm,
  CartItem,
} from '@/types/database.types';

/**
 * Generate unique order number
 */
const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${year}${month}${day}${random}`;
};

/**
 * Create a new order from cart items
 */
export const createOrder = async (
  userId: string,
  cartItems: CartItem[],
  checkoutForm: CheckoutForm,
): Promise<{ order: Order | null; error: string | null }> => {
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.sale_price || item.variant?.price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = checkoutForm.payment_method === 'at_store' ? 0 : 30000; // 30k shipping
  const totalAmount = subtotal + shippingFee;

  // Create order
  const orderData: InsertTables<'orders'> = {
    order_number: generateOrderNumber(),
    user_id: userId,
    status: 'pending',
    payment_status: 'pending',
    payment_method: checkoutForm.payment_method,
    subtotal,
    shipping_fee: shippingFee,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: totalAmount,
    shipping_name: checkoutForm.shipping_name,
    shipping_phone: checkoutForm.shipping_phone,
    shipping_email: checkoutForm.shipping_email,
    shipping_address: checkoutForm.shipping_address,
    shipping_city: checkoutForm.shipping_city,
    shipping_district: checkoutForm.shipping_district,
    shipping_ward: checkoutForm.shipping_ward,
    shipping_note: checkoutForm.shipping_note || null,
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError || !order) {
    console.error('Error creating order:', orderError);
    return { order: null, error: orderError?.message || 'Failed to create order' };
  }

  // Create order items
  const orderItems: InsertTables<'order_items'>[] = cartItems.map((item) => {
    const price = item.variant?.sale_price || item.variant?.price || item.product.price;
    return {
      order_id: order.id,
      product_id: item.product.id,
      variant_id: item.variant?.id || null,
      product_name: item.product.name,
      variant_name: item.variant?.name || null,
      sku: item.variant?.sku || item.product.sku,
      image_url: item.variant?.image_url || item.product.image_url,
      unit_price: price,
      quantity: item.quantity,
      discount_amount: 0,
      total_price: price * item.quantity,
    };
  });

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // Rollback order if items creation fails
    await supabase.from('orders').delete().eq('id', order.id);
    return { order: null, error: 'Failed to create order items' };
  }

  return { order, error: null };
};

/**
 * Fetch user orders
 */
export const fetchUserOrders = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ orders: (Order & { items: OrderItem[] })[]; hasMore: boolean }> => {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('orders')
    .select('*, items:order_items(*)', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching orders:', error);
    return { orders: [], hasMore: false };
  }

  return {
    orders: (data as any) || [],
    hasMore: count ? offset + limit < count : false,
  };
};

/**
 * Fetch order detail with items
 */
export const fetchOrderDetail = async (
  orderId: string,
): Promise<{ order: Order | null; items: OrderItem[] }> => {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('Error fetching order:', orderError);
    return { order: null, items: [] };
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error('Error fetching order items:', itemsError);
  }

  return {
    order,
    items: items || [],
  };
};
