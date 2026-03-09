import { supabase } from './client';
import type { Product, ProductVariant, ProductDetail, Brand } from '@/types/database.types';

export interface ProductReview {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  rating: number;
  content: string | null;
  images: string[] | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user?: any; // User details joined
}

export interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

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
    // @ts-ignore
    .eq('status', 'active')
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

    product_variants: variants || [],
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
  let productIds: string[] = [];

  if (categoryId) {
    const { data: junctionData } = await supabase
      .from('product_categories_junction')
      .select('product_id')
      .eq('category_id', categoryId);

    if (junctionData) {
      productIds = junctionData.map((j) => j.product_id);
    }
  }

  let query = supabase
    .from('products')
    .select('*')
    .neq('id', productId)
    // @ts-ignore
    .eq('status', 'active')
    .eq('is_active', true)
    .is('deleted_at', null);

  if (categoryId) {
    if (productIds.length > 0) {
      query = query.in('id', productIds);
    } else {
      // Category provided but no products found in junction, return empty
      return [];
    }
  }

  const { data, error } = await query.limit(limit).order('created_at', { ascending: false });

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
    // @ts-ignore
    .eq('status', 'active')
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
    // @ts-ignore
    .eq('status', 'active')
    .eq('is_active', true)
    .is('deleted_at', null);

  if (filter?.categoryIds && filter.categoryIds.length > 0) {
    // Get product IDs from junction table
    const { data: junctionData, error: junctionError } = await supabase
      .from('product_categories_junction')
      .select('product_id')
      .in('category_id', filter.categoryIds);

    if (junctionError) {
      console.error('Error fetching junction in search:', junctionError);
      return [];
    }

    const categoryProductIds = junctionData?.map((j) => j.product_id) || [];

    if (categoryProductIds.length > 0) {
      query = query.in('id', categoryProductIds);
    } else {
      // Filter provided but no products match category, return empty
      return [];
    }
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
 * Fetch all active brands from brands table
 */
export const fetchBrandsFromTable = async (): Promise<Brand[]> => {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching brands:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all unique brands (legacy - from products table)
 * @deprecated Use fetchBrandsFromTable instead
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

/**
 * Submit product review
 */
export interface SubmitReviewParams {
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment: string | null;
  images?: string[];
}

export const submitProductReview = async (params: SubmitReviewParams): Promise<boolean> => {
  const { productId, userId, orderId, rating, comment, images } = params;

  // Check if user already reviewed this product for this order
  const { data: existing } = await supabase
    .from('product_reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .eq('order_id', orderId)
    .is('deleted_at', null)
    .single();

  if (existing) {
    // Update existing review
    const { error } = await supabase
      .from('product_reviews')
      .update({
        rating,
        content: comment,
        images: images || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  } else {
    // Create new review
    const { error } = await supabase.from('product_reviews').insert({
      product_id: productId,
      user_id: userId,
      order_id: orderId,
      rating,
      content: comment,
      images: images || [],
      is_verified_purchase: true,
    });

    if (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  return true;
};

/**
 * Check if user has reviewed products in an order
 */
export const checkOrderReviewed = async (
  orderId: string,
  userId: string,
): Promise<{ reviewed: boolean; reviewedProductIds: string[] }> => {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('product_id')
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) {
    console.error('Error checking reviews:', error);
    return { reviewed: false, reviewedProductIds: [] };
  }

  const reviewedProductIds = data?.map((r) => r.product_id).filter(Boolean) as string[];
  return {
    reviewed: reviewedProductIds.length > 0,
    reviewedProductIds,
  };
};

/**
 * Fetch full reviews for an order
 */
export const fetchReviewsForOrder = async (
  orderId: string,
  userId: string,
): Promise<ProductReview[]> => {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('order_id', orderId)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching order reviews:', error);
    return [];
  }

  return (data as unknown as ProductReview[]) || [];
};

/**
 * Fetch user's favorite products
 */
export const fetchFavorites = async (userId: string): Promise<Product[]> => {
  const { data, error } = await (supabase as any)
    .from('favorites')
    .select(
      `
      product_id,
      products (*)
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  // Filter out any null products (e.g. deleted) and cast
  return (data || [])
    .map((item: any) => item.products)
    .filter((product: any) => product !== null) as Product[];
};
