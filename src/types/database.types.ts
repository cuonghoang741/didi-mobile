export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      banners: {
        Row: {
          button_text: string | null;
          created_at: string | null;
          deleted_at: string | null;
          end_date: string | null;
          id: string;
          image_url: string;
          is_active: boolean | null;
          link_target: string | null;
          link_url: string | null;
          mobile_image_url: string | null;
          position: string | null;
          product_id: string | null;
          sort_order: number | null;
          start_date: string | null;
          subtitle: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          button_text?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          end_date?: string | null;
          id?: string;
          image_url: string;
          is_active?: boolean | null;
          link_target?: string | null;
          link_url?: string | null;
          mobile_image_url?: string | null;
          position?: string | null;
          product_id?: string | null;
          sort_order?: number | null;
          start_date?: string | null;
          subtitle?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          button_text?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          end_date?: string | null;
          id?: string;
          image_url?: string;
          is_active?: boolean | null;
          link_target?: string | null;
          link_url?: string | null;
          mobile_image_url?: string | null;
          position?: string | null;
          product_id?: string | null;
          sort_order?: string | null;
          start_date?: string | null;
          subtitle?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      flash_sales: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          end_time: string;
          id: string;
          is_active: boolean | null;
          name: string;
          start_time: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          end_time: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          start_time: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          end_time?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          start_time?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      flash_sale_products: {
        Row: {
          created_at: string | null;
          flash_sale_id: string;
          id: string;
          product_id: string;
          quantity_limit: number | null;
          quantity_sold: number | null;
          sale_price: number;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          flash_sale_id: string;
          id?: string;
          product_id: string;
          quantity_limit?: number | null;
          quantity_sold?: number | null;
          sale_price: number;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          flash_sale_id?: string;
          id?: string;
          product_id?: string;
          quantity_limit?: number | null;
          quantity_sold?: number | null;
          sale_price?: number;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          brand: string | null;
          category_id: string | null;
          compare_at_price: number | null;
          created_at: string | null;
          deleted_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          images: Json | null;
          is_active: boolean | null;
          is_featured: boolean | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          price: number;
          sku: string;
          slug: string;
          sort_order: number | null;
          stock_quantity: number | null;
          updated_at: string | null;
          weight: number | null;
        };
        Insert: {
          brand?: string | null;
          category_id?: string | null;
          compare_at_price?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: Json | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          price: number;
          sku: string;
          slug: string;
          sort_order?: number | null;
          stock_quantity?: number | null;
          updated_at?: string | null;
          weight?: number | null;
        };
        Update: {
          brand?: string | null;
          category_id?: string | null;
          compare_at_price?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: Json | null;
          is_active?: boolean | null;
          is_featured?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          price?: number;
          sku?: string;
          slug?: string;
          sort_order?: number | null;
          stock_quantity?: number | null;
          updated_at?: string | null;
          weight?: number | null;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string | null;
          name: string | null;
          color: string | null;
          color_code: string | null;
          storage: string | null;
          ram: string | null;
          attributes: Json | null;
          price: number;
          sale_price: number | null;
          cost_price: number | null;
          stock_quantity: number | null;
          low_stock_threshold: number | null;
          image_url: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku?: string | null;
          name?: string | null;
          color?: string | null;
          color_code?: string | null;
          storage?: string | null;
          ram?: string | null;
          attributes?: Json | null;
          price: number;
          sale_price?: number | null;
          cost_price?: number | null;
          stock_quantity?: number | null;
          low_stock_threshold?: number | null;
          image_url?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string | null;
          name?: string | null;
          color?: string | null;
          color_code?: string | null;
          storage?: string | null;
          ram?: string | null;
          attributes?: Json | null;
          price?: number;
          sale_price?: number | null;
          cost_price?: number | null;
          stock_quantity?: number | null;
          low_stock_threshold?: number | null;
          image_url?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          title: string | null;
          comment: string | null;
          images: Json | null;
          is_verified_purchase: boolean | null;
          is_approved: boolean | null;
          helpful_count: number | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          rating: number;
          title?: string | null;
          comment?: string | null;
          images?: Json | null;
          is_verified_purchase?: boolean | null;
          is_approved?: boolean | null;
          helpful_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string;
          rating?: number;
          title?: string | null;
          comment?: string | null;
          images?: Json | null;
          is_verified_purchase?: boolean | null;
          is_approved?: boolean | null;
          helpful_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          status: string;
          payment_status: string | null;
          payment_method: string | null;
          subtotal: number;
          discount_amount: number | null;
          shipping_fee: number | null;
          tax_amount: number | null;
          total_amount: number;
          shipping_name: string | null;
          shipping_phone: string | null;
          shipping_email: string | null;
          shipping_address: string | null;
          shipping_city: string | null;
          shipping_district: string | null;
          shipping_ward: string | null;
          shipping_note: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id: string;
          status?: string;
          payment_status?: string | null;
          payment_method?: string | null;
          subtotal: number;
          discount_amount?: number | null;
          shipping_fee?: number | null;
          tax_amount?: number | null;
          total_amount: number;
          shipping_name?: string | null;
          shipping_phone?: string | null;
          shipping_email?: string | null;
          shipping_address?: string | null;
          shipping_city?: string | null;
          shipping_district?: string | null;
          shipping_ward?: string | null;
          shipping_note?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string;
          status?: string;
          payment_status?: string | null;
          payment_method?: string | null;
          subtotal?: number;
          discount_amount?: number | null;
          shipping_fee?: number | null;
          tax_amount?: number | null;
          total_amount?: number;
          shipping_name?: string | null;
          shipping_phone?: string | null;
          shipping_email?: string | null;
          shipping_address?: string | null;
          shipping_city?: string | null;
          shipping_district?: string | null;
          shipping_ward?: string | null;
          shipping_note?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
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
          discount_amount: number | null;
          total_price: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          variant_name?: string | null;
          sku?: string | null;
          image_url?: string | null;
          unit_price: number;
          quantity: number;
          discount_amount?: number | null;
          total_price: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name?: string;
          variant_name?: string | null;
          sku?: string | null;
          image_url?: string | null;
          unit_price?: number;
          quantity?: number;
          discount_amount?: number | null;
          total_price?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_categories_junction: {
        Row: {
          category_id: string;
          product_id: string;
        };
        Insert: {
          category_id: string;
          product_id: string;
        };
        Update: {
          category_id?: string;
          product_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          deleted_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          loyalty_points: number | null;
          phone: string | null;
          role: string | null;
          status: string | null;
          total_orders: number | null;
          total_spent: number | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          loyalty_points?: number | null;
          phone?: string | null;
          role?: string | null;
          status?: string | null;
          total_orders?: number | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          loyalty_points?: number | null;
          phone?: string | null;
          role?: string | null;
          status?: string | null;
          total_orders?: number | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience types
export type Banner = Tables<'banners'>;
export type Category = Tables<'categories'>;
export type Product = Tables<'products'>;
export type ProductVariant = Tables<'product_variants'>;
export type ProductReview = Tables<'product_reviews'>;
export type FlashSale = Tables<'flash_sales'>;
export type FlashSaleProduct = Tables<'flash_sale_products'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type User = Tables<'users'>;

// Product with flash sale price
export type ProductWithFlashSale = Product & {
  flash_sale_price?: number | null;
  flash_sale_quantity_limit?: number | null;
  flash_sale_quantity_sold?: number | null;
};

// Product with variants and reviews
export type ProductDetail = Product & {
  variants: ProductVariant[];
  reviews: (ProductReview & { user?: User })[];
  avg_rating?: number;
  review_count?: number;
};

// Cart item type (local state)
export interface CartItem {
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
}

// Payment methods
export type PaymentMethod = 'at_store' | 'bank_transfer' | 'daibiki';

// Checkout form
export interface CheckoutForm {
  shipping_name: string;
  shipping_phone: string;
  shipping_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_district: string;
  shipping_ward: string;
  shipping_note?: string;
  payment_method: PaymentMethod;
}
