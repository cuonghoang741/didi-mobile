import { BaseEntity, BannerPosition, FlashSaleStatus, CouponType } from './common';

export interface Banner extends BaseEntity {
  title: string;
  image_url: string;
  position: BannerPosition;
  is_active: boolean;
  sort_order: number;
  link_url: string | null;
  product_id: string | null; // Liên kết tới bảng products
}

export interface FlashSale extends BaseEntity {
  name: string;
  start_time: string;
  end_time: string;
  status: FlashSaleStatus;
  is_active: boolean;
}

export interface Coupon extends BaseEntity {
  code: string;
  discount_type: CouponType;
  discount_value: number;
  is_active: boolean;
  usage_limit: number;
  start_date: string;
  end_date: string;
}
