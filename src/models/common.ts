export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partial_refund';
export type PaymentMethod =
  | 'cod'
  | 'bank_transfer'
  | 'momo'
  | 'vnpay'
  | 'zalopay'
  | 'at_store'
  | 'daibiki';
export type CustomerStatus = 'active' | 'inactive' | 'blocked';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'spam';
export type InventoryStatus = 'in_stock' | 'sold' | 'reserved' | 'defective' | 'returned';
export type BannerPosition = 'home_hero' | 'home_secondary' | 'category' | 'product' | 'popup';
export type FlashSaleStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';
export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type AddressType = 'shipping' | 'billing';

export interface MultiLanguage {
  vi: string;
  en?: string;
  jp?: string;
  [key: string]: string | undefined;
}

export interface ProductLanguage {
  name?: MultiLanguage;
  short_description?: MultiLanguage;
  description?: MultiLanguage;
}

export interface ProductSpecifications {
  screen?: string;
  cpu?: string;
  ram?: string;
  storage?: string;
  battery?: string;
  camera?: string;
  os?: string;
  connectivity?: string;
  dimensions?: string;
  weight?: string;
  [key: string]: string | undefined;
}

export interface VariantAttributes {
  color?: string;
  storage?: string;
  ram?: string;
  [key: string]: string | undefined;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  ward?: string;
  district?: string;
  city: string;
  province?: string;
  postal_code?: string;
  country?: string;
  image_url?: string;
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // Trường mới hỗ trợ Soft Delete
}
