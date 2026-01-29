import {
  BaseEntity,
  ProductStatus,
  ProductSpecifications,
  ProductLanguage,
  VariantAttributes,
} from './common';

export interface Product extends BaseEntity {
  sku: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  specifications: ProductSpecifications | null;
  language: ProductLanguage | null;

  // Pricing
  base_price: number;
  sale_price: number | null;
  cost_price: number | null;

  // Media
  thumbnail_url: string | null;
  image_urls: string[] | null;
  video_url: string | null;

  // SEO
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;

  // Relations
  category_id: string | null; // Cột cũ (1-n) - giữ để tương thích ngược
  brand_id: string | null;
  brand: string | null; // Cột text cũ để tương thích ngược hoặc lưu nhanh

  // Many-to-Many Relations (Mới cập nhật)
  category_ids?: string[] | null; // Danh sách ID danh mục từ bảng junction
  related_ids?: string[] | null; // Danh sách ID sản phẩm liên quan/mua kèm

  // Flash Sale integration
  flash_sale_id: string | null;
  flash_sale_price: number | null;

  // Status & Settings
  status: ProductStatus;
  is_featured: boolean;
  featured_sort_order: number;
  track_inventory: boolean;
  allow_backorder: boolean;

  // Stats
  view_count: number;
  sold_count: number;
  rating_average: number;
  rating_count: number;

  // Timestamps
  published_at: string | null;
}

export interface ProductVariant extends BaseEntity {
  product_id: string;
  sku: string;
  name: string;

  // Variant attributes
  color: string | null;
  color_code: string | null;
  storage: string | null;
  ram: string | null;
  attributes: VariantAttributes | null;

  // Pricing
  price: number;
  sale_price: number | null;
  cost_price: number | null;

  // Stock
  stock_quantity: number;
  low_stock_threshold: number;

  // Media
  image_url: string | null;

  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}
