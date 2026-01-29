import { supabase } from './client';
import type {
  Product,
  ProductVariant,
  ProductReview,
  ProductDetail,
  User,
} from '@/types/database.types';

/**
 * Fetch product detail by ID with variants and reviews
 */
export const fetchProductDetail = async (productId: string): Promise<ProductDetail | null> => {
  // Fetch product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .is('deleted_at', null)
    .single();

  if (productError || !product) {
    console.error('Error fetching product:', productError);
    return null;
  }

  // Fetch variants
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('price', { ascending: true });

  if (variantsError) {
    console.error('Error fetching variants:', variantsError);
  }

  // Fetch category_ids from junction table
  const { data: categoriesData } = await supabase
    .from('product_categories_junction')
    .select('category_id')
    .eq('product_id', productId);

  const category_ids = categoriesData?.map((c) => c.category_id) || [];

  // Check if related_ids exists in product (if it's a column)
  // If it's not in the type, we treat product as any to access it safely
  const related_ids = (product as any).related_ids || [];

  // Fetch reviews with user info
  const { data: reviews, error: reviewsError } = await supabase

    .from('product_reviews')
    .select(
      `
      *,
      users (
        id,
        full_name,
        avatar_url
      )
    `,
    )
    .eq('product_id', productId)
    .eq('is_approved', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
  }

  // Calculate average rating
  const reviewList = reviews || [];

  const avgRating =
    reviewList.length > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
      : 0;

  return {
    ...product,
    category_ids: category_ids,
    related_ids: related_ids,

    variants: variants || [],
    reviews: reviewList.map((r: any) => ({
      ...r,
      user: r.users,
    })),
    avg_rating: avgRating,
    review_count: reviewList.length,
  } as any;
};

/**
 * Fetch product reviews with pagination
 */
export const fetchProductReviews = async (
  productId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ reviews: (ProductReview & { user?: User })[]; hasMore: boolean }> => {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('product_reviews')
    .select(
      `
      *,
      users (
        id,
        full_name,
        avatar_url
      )
    `,
      { count: 'exact' },
    )
    .eq('product_id', productId)
    .eq('is_approved', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching reviews:', error);
    return { reviews: [], hasMore: false };
  }

  return {
    reviews: (data || []).map((r: any) => ({
      ...r,
      user: r.users,
    })),
    hasMore: count ? offset + limit < count : false,
  };
};

/**
 * Fetch related products
 */
export const fetchRelatedProducts = async (
  productId: string,
  categoryId: string | null,
  limit: number = 6,
): Promise<Product[]> => {
  let query = supabase
    .from('products')
    .select('*')
    .neq('id', productId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .limit(limit);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching related products:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch products by specific IDs (for related/buy along)
 */
export const fetchProductsByIds = async (ids: string[]): Promise<Product[]> => {
  if (!ids || ids.length === 0) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching products by IDs:', error);
    return [];
  }

  return data || [];
};

/**
 * Search filter options
 */
export interface SearchFilter {
  categoryIds?: string[];
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Search products by name and filters
 */
export const searchProducts = async (
  queryText: string,
  filter?: SearchFilter,
  limit: number = 20,
): Promise<Product[]> => {
  let query = supabase
    .from('products')
    .select('*')
    .ilike('name', `%${queryText}%`)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (filter?.categoryIds && filter.categoryIds.length > 0) {
    // Note: This only checks direct category_id column.
    // For many-to-many, we'd need a more complex query or junction filtering.
    // Assuming simple category structure for now based on 'category_id' column existence.
    query = query.in('category_id', filter.categoryIds);
  }

  if (filter?.brand) {
    query = query.eq('brand', filter.brand);
  }

  if (filter?.minPrice !== undefined) {
    query = query.gte('price', filter.minPrice);
  }

  if (filter?.maxPrice !== undefined) {
    query = query.lte('price', filter.maxPrice);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all unique brands
 */
export const fetchBrands = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .neq('brand', null)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching brands:', error);
    return [];
  }

  // Get unique brands
  const brands = Array.from(new Set(data?.map((item) => item.brand).filter(Boolean))) as string[];
  return brands;
};
