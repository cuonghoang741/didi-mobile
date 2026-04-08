import { supabase } from './client';
import type { ShippingAddress, PaymentMethod, OrderStatus, PaymentStatus } from '@/models/common';
import type { CartItem } from '@/types/database.types';

/**
 * Checkout form data from the checkout screen
 */
export interface CheckoutForm {
  shipping_name: string;
  shipping_phone: string;
  shipping_email?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_district?: string;
  shipping_ward?: string;
  shipping_note?: string;
  delivery_time_slot?: string;
  payment_method: PaymentMethod;
  shipping_fee?: number;
  discount_amount?: number;
  shipping_image_url?: string;
}

/**
 * Order type matching actual database structure
 */
export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  payment_proof_url: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  shipping_address: ShippingAddress | null;
  customer_note: string | null;
  delivery_time_slot: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_reviewed?: boolean;
}

/**
 * OrderItem type matching actual database structure
 */
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  total_price: number;
  created_at: string | null;
}

// Using CartItem from @/types/database.types

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
 * Send notification to all admin users when a new order is created
 * This function calls a Supabase Edge Function that uses OneSignal to send push notifications
 */
const notifyAdminsNewOrder = async (
  orderId: string,
  orderNumber: string,
  customerName: string,
  totalAmount: number,
  itemsCount: number,
): Promise<void> => {
  try {
    const { data, error } = await supabase.functions.invoke('notify-admin-new-order', {
      body: {
        order_id: orderId,
        order_number: orderNumber,
        customer_name: customerName,
        total_amount: totalAmount,
        items_count: itemsCount,
      },
    });

    if (error) {
      console.error('Error sending admin notification:', error);
    } else {
      console.log('Admin notification sent successfully:', data);
    }
  } catch (err) {
    console.error('Failed to notify admins about new order:', err);
  }
};

/**
 * Get price from cart item (handles both product base price and variant price)
 */
const getItemPrice = (item: CartItem): number => {
  // Check variant price first (match UI logic in checkout.tsx)
  if (item.variant) {
    const variant = item.variant as any;
    // UI just uses item.variant?.price
    return variant.price || 0;
  }
  // Fall back to product price
  const product = item.product as any;
  return product.sale_price || product.base_price || product.price || 0;
};

/**
 * Create a new order from cart items
 * Uses the actual database structure with shipping_address as JSONB
 */
export const createOrder = async (
  userId: string,
  cartItems: CartItem[],
  checkoutForm: CheckoutForm,
): Promise<{ order: Order | null; error: string | null }> => {
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + getItemPrice(item) * item.quantity;
  }, 0);

  const shippingFee =
    checkoutForm.shipping_fee ?? (checkoutForm.payment_method === 'at_store' ? 0 : 500);
  const discountAmount = checkoutForm.discount_amount ?? 0;
  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

  // Build shipping address as JSONB object matching ShippingAddress interface
  const shippingAddress: ShippingAddress = {
    full_name: checkoutForm.shipping_name,
    phone: checkoutForm.shipping_phone,
    address_line1: checkoutForm.shipping_address,
    ward: checkoutForm.shipping_ward,
    district: checkoutForm.shipping_district,
    city: checkoutForm.shipping_city,
    image_url: checkoutForm.shipping_image_url,
  };

  // Create order data matching actual database structure
  const orderData = {
    order_number: generateOrderNumber(),
    customer_id: userId,
    status: 'pending',
    payment_status: 'pending',
    payment_method: checkoutForm.payment_method,
    subtotal,
    shipping_fee: shippingFee,
    discount_amount: discountAmount,
    tax_amount: 0,
    total_amount: totalAmount,
    shipping_address: shippingAddress,
    customer_note: checkoutForm.shipping_note || null,
    delivery_time_slot: checkoutForm.delivery_time_slot || null,
  };

  // Insert order - use type assertion for Supabase response
  const { data: orderResult, error: orderError } = await supabase
    .from('orders')
    .insert(orderData as any)
    .select()
    .single();

  if (orderError || !orderResult) {
    console.error('Error creating order:', orderError);
    return { order: null, error: orderError?.message || 'Failed to create order' };
  }

  const order = orderResult as any;

  // Create order items - matches actual order_items table structure
  const orderItems = cartItems.map((item) => {
    const price = getItemPrice(item);
    const variant = item.variant as any;
    const product = item.product as any;
    return {
      order_id: order.id,
      product_id: product.id,
      variant_id: variant?.id || null,
      product_name: product.name,
      variant_name: variant?.name || null,
      sku: variant?.sku || product.sku || null,
      image_url: variant?.image_url || product.thumbnail_url || null,
      unit_price: price,
      quantity: item.quantity,
      discount_amount: 0,
      total_price: price * item.quantity,
    };
  });

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems as any);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
    // Rollback order if items creation fails
    await supabase.from('orders').delete().eq('id', order.id);
    return { order: null, error: 'Failed to create order items' };
  }

  // Send notification to admins (fire and forget)
  notifyAdminsNewOrder(
    order.id,
    order.order_number,
    checkoutForm.shipping_name,
    totalAmount,
    cartItems.length,
  );

  // Map response to Order type
  const mappedOrder: Order = {
    id: order.id,
    order_number: order.order_number,
    customer_id: order.customer_id,
    status: order.status as OrderStatus,
    payment_status: order.payment_status as PaymentStatus,
    payment_method: order.payment_method as PaymentMethod,
    payment_proof_url: order.payment_proof_url,
    subtotal: Number(order.subtotal),
    discount_amount: Number(order.discount_amount) || 0,
    shipping_fee: Number(order.shipping_fee) || 0,
    tax_amount: Number(order.tax_amount) || 0,
    total_amount: Number(order.total_amount),
    shipping_address: order.shipping_address,
    customer_note: order.customer_note,
    delivery_time_slot: order.delivery_time_slot,
    created_at: order.created_at,
    updated_at: order.updated_at,
    deleted_at: order.deleted_at,
  };

  return { order: mappedOrder, error: null };
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
    .select('*, items:order_items(*), product_reviews(id)', { count: 'exact' })
    .eq('customer_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching orders:', error);
    return { orders: [], hasMore: false };
  }

  // Map to proper types
  const orders =
    (data as any[])?.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      customer_id: order.customer_id,
      status: order.status as OrderStatus,
      payment_status: order.payment_status as PaymentStatus,
      payment_method: order.payment_method as PaymentMethod,
      payment_proof_url: order.payment_proof_url,
      subtotal: Number(order.subtotal),
      discount_amount: Number(order.discount_amount) || 0,
      shipping_fee: Number(order.shipping_fee) || 0,
      tax_amount: Number(order.tax_amount) || 0,
      total_amount: Number(order.total_amount),
      shipping_address: order.shipping_address,
      customer_note: order.customer_note,
      delivery_time_slot: order.delivery_time_slot,
      created_at: order.created_at,
      updated_at: order.updated_at,
      deleted_at: order.deleted_at,
      items: order.items || [],
      is_reviewed: order.product_reviews && order.product_reviews.length > 0,
    })) || [];

  return {
    orders,
    hasMore: count ? offset + limit < count : false,
  };
};

/**
 * Fetch order detail with items
 */
export const fetchOrderDetail = async (
  orderId: string,
): Promise<{ order: Order | null; items: OrderItem[] }> => {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !orderData) {
    console.error('Error fetching order:', orderError);
    return { order: null, items: [] };
  }

  const order = orderData as any;

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error('Error fetching order items:', itemsError);
  }

  const mappedOrder: Order = {
    id: order.id,
    order_number: order.order_number,
    customer_id: order.customer_id,
    status: order.status as OrderStatus,
    payment_status: order.payment_status as PaymentStatus,
    payment_method: order.payment_method as PaymentMethod,
    payment_proof_url: order.payment_proof_url,
    subtotal: Number(order.subtotal),
    discount_amount: Number(order.discount_amount) || 0,
    shipping_fee: Number(order.shipping_fee) || 0,
    tax_amount: Number(order.tax_amount) || 0,
    total_amount: Number(order.total_amount),
    shipping_address: order.shipping_address,
    customer_note: order.customer_note,
    delivery_time_slot: order.delivery_time_slot,
    created_at: order.created_at,
    updated_at: order.updated_at,
    deleted_at: order.deleted_at,
  };

  return {
    order: mappedOrder,
    items: (items as unknown as OrderItem[]) || [],
  };
};

export const cancelOrder = async (
  orderId: string,
  reason: string,
): Promise<{ success: boolean; error: string | null }> => {
  // First fetch the current order to get existing customer_note
  const { data: order } = await supabase
    .from('orders')
    .select('customer_note')
    .eq('id', orderId)
    .single();

  let updatedNote = reason;
  if ((order as any) && (order as any).customer_note) {
    updatedNote = `${(order as any).customer_note}\n\nLý do huỷ: ${reason}`;
  } else {
    updatedNote = `Lý do huỷ: ${reason}`;
  }

  const updateData: any = {
    status: 'cancelled',
    customer_note: updatedNote,
  };

  const { error } = await supabase
    .from('orders')
    .update(updateData as never)
    .eq('id', orderId);

  if (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
};
