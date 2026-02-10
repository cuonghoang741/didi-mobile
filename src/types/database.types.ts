export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          button_text: string | null
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          end_date: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_target: string | null
          link_url: string | null
          mobile_image_url: string | null
          position: string | null
          product_id: string | null
          sort_order: number | null
          start_date: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          button_text?: string | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_target?: string | null
          link_url?: string | null
          mobile_image_url?: string | null
          position?: string | null
          product_id?: string | null
          sort_order?: number | null
          start_date?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          button_text?: string | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_target?: string | null
          link_url?: string | null
          mobile_image_url?: string | null
          position?: string | null
          product_id?: string | null
          sort_order?: number | null
          start_date?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          mobile_icon_url: string | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          mobile_icon_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          mobile_icon_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
      }
      customer_addresses: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          banchi: string | null
          building_name: string | null
          city: string | null
          country: string | null
          created_at: string | null
          customer_id: string | null
          district: string | null
          first_name: string | null
          full_name: string | null
          id: string
          image_url: string | null
          is_default: boolean | null
          last_name: string | null
          nickname: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          type: string | null
          updated_at: string | null
          ward: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          banchi?: string | null
          building_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id?: string | null
          district?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          image_url?: string | null
          is_default?: boolean | null
          last_name?: string | null
          nickname?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          type?: string | null
          updated_at?: string | null
          ward?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          banchi?: string | null
          building_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_id?: string | null
          district?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          image_url?: string | null
          is_default?: boolean | null
          last_name?: string | null
          nickname?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          type?: string | null
          updated_at?: string | null
          ward?: string | null
        }
      }
      customer_vouchers: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          is_used: boolean | null
          order_id: string | null
          used_at: string | null
          voucher_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_used?: boolean | null
          order_id?: string | null
          used_at?: string | null
          voucher_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_used?: boolean | null
          order_id?: string | null
          used_at?: string | null
          voucher_id?: string | null
        }
      }
      customers: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          price: number
          product_id: string | null
          product_name: string
          product_variant_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          price: number
          product_id?: string | null
          product_name: string
          product_variant_id?: string | null
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          price?: number
          product_id?: string | null
          product_name?: string
          product_variant_id?: string | null
          quantity?: number
        }
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_note: string | null
          delivery_date: string | null
          delivery_time_slot: string | null
          discount_amount: number | null
          id: string
          order_number: string
          payment_method: string | null
          payment_proof_url: string | null
          payment_status: string | null
          shipping_address: Json | null
          shipping_fee: number | null
          status: string | null
          subtotal_amount: number
          total_amount: number
          updated_at: string | null
          voucher_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_note?: string | null
          delivery_date?: string | null
          delivery_time_slot?: string | null
          discount_amount?: number | null
          id?: string
          order_number: string
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_fee?: number | null
          status?: string | null
          subtotal_amount: number
          total_amount: number
          updated_at?: string | null
          voucher_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_note?: string | null
          delivery_date?: string | null
          delivery_time_slot?: string | null
          discount_amount?: number | null
          id?: string
          order_number?: string
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          shipping_fee?: number | null
          status?: string | null
          subtotal_amount?: number
          total_amount?: number
          updated_at?: string | null
          voucher_id?: string | null
        }
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_thumbnail: boolean | null
          product_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_thumbnail?: boolean | null
          product_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_thumbnail?: boolean | null
          product_id?: string | null
        }
      }
      product_variants: {
        Row: {
          attributes: Json | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          price: number
          product_id: string | null
          sku: string | null
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          price: number
          product_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          product_id?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_popular: boolean | null
          language: Json | null
          name: string
          origin: string | null
          price: number
          short_description: string | null
          slug: string
          sold_count: number | null
          stock_quantity: number | null
          unit: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          language?: Json | null
          name: string
          origin?: string | null
          price: number
          short_description?: string | null
          slug: string
          sold_count?: number | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_popular?: boolean | null
          language?: Json | null
          name?: string
          origin?: string | null
          price?: number
          short_description?: string | null
          slug?: string
          sold_count?: number | null
          stock_quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string | null
          value?: string
        }
      }
      vouchers: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
          start_date: string | null
          title: string
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          start_date?: string | null
          title: string
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
          used_count?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_phone_exists: {
        Args: {
          phone_number: string
        }
        Returns: {
          exists: boolean
          has_password: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
    Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
    Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof Database["public"]["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof Database["public"]["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
  ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export type Product = Tables<'products'> & {
  base_price?: number;
  sale_price?: number;
  thumbnail_url?: string;
  image_urls?: string[];
  rating_average?: number;
};

export type ProductWithFlashSale = Product & {
  flash_sale_price?: number;
};

export type Category = Tables<'categories'>;
// Mock Brand type since it was missing from generated types
export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};
export type Banner = Tables<'banners'>;
export type ProductVariant = Tables<'product_variants'>;
export type ProductDetail = Product & {
  variants: ProductVariant[];
  product_variants: ProductVariant[];
  images: Tables<'product_images'>[];
  avg_rating?: number;
  review_count?: number;
  specifications?: Record<string, string | number> | null;
};

export type CartItem = {
  id?: string;
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
};

export type MultiLanguageData = {
  name?: Record<string, string>;
  short_description?: Record<string, string>;
  description?: Record<string, string>;
  warranty?: Record<string, string>;
};
