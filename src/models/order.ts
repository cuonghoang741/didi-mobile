import { BaseEntity, OrderStatus, PaymentStatus, ShippingAddress, PaymentMethod } from './common';

export interface Order extends BaseEntity {
  order_number: string;
  user_id: string | null; // Đổi từ customer_id sang user_id
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_proof_url: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  tax_amount: number;
  total_amount: number;
  shipping_address: ShippingAddress | null;
  notes: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
}
