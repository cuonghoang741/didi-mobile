import type {
  Banner,
  Category,
  Product,
  FlashSale,
  ProductWithFlashSale,
} from '@/types/database.types';

import { supabase } from './client';

export interface HomeData {
  banners: Banner[];
  featuredProducts: Product[];
  flashSale: FlashSale | null;
  flashSaleProducts: ProductWithFlashSale[];
  categories: Category[];
  categoriesWithProducts: CategoryWithProducts[];
}

export interface CategoryWithProducts {
  category: Category;
  products: Product[];
}

/**
 * Fetch active banners ordered by sort_order
 */
export const fetchBanners = async (): Promise<Banner[]> => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching banners:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch featured products
 */
export const fetchFeaturedProducts = async (limit: number = 10): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .is('deleted_at', null)
    .order('featured_sort_order', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch active flash sale with its products
 */
export const fetchActiveFlashSale = async (): Promise<{
  flashSale: FlashSale | null;
  products: ProductWithFlashSale[];
}> => {
  const now = new Date().toISOString();

  // Find active flash sale
  const { data: flashSaleData, error: flashSaleError } = await supabase
    .from('flash_sales')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .lte('start_time', now)
    .gte('end_time', now)
    .order('start_time', { ascending: false })
    .limit(1)
    .single();

  if (flashSaleError || !flashSaleData) {
    return { flashSale: null, products: [] };
  }

  // Fetch flash sale products with product details
  const { data: flashSaleItems, error: productsError } = await supabase
    .from('flash_sale_items')
    .select(
      `
      *,
      products (*)
    `,
    )
    .eq('flash_sale_id', flashSaleData.id)
    .order('sort_order', { ascending: true });

  if (productsError || !flashSaleItems) {
    return { flashSale: flashSaleData, products: [] };
  }

  const products: ProductWithFlashSale[] = flashSaleItems.map((item: any) => ({
    ...item.products,
    flash_sale_price: item.sale_price,
    flash_sale_quantity_limit: item.stock_limit,
    flash_sale_quantity_sold: item.sold_count,
  }));

  return { flashSale: flashSaleData, products };
};

/**
 * Fetch first N categories with first M products of each
 */
export const fetchCategoriesWithProducts = async (
  categoryLimit: number = 3,
  productLimit: number = 5,
): Promise<CategoryWithProducts[]> => {
  // Fetch categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .is('parent_id', null) // Only top-level categories
    .order('sort_order', { ascending: true })
    .limit(categoryLimit);

  if (categoriesError || !categories) {
    console.error('Error fetching categories:', categoriesError);
    return [];
  }

  // Fetch products for each category
  const result: CategoryWithProducts[] = [];

  for (const category of categories) {
    // Fetch subcategories
    const { data: subCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', category.id)
      .is('deleted_at', null)
      .eq('is_active', true);

    const categoryIds = [category.id, ...(subCategories?.map((c) => c.id) || [])];

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('category_id', categoryIds)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(productLimit);

    if (!productsError && products && products.length > 0) {
      result.push({
        category,
        products,
      });
    }
  }

  return result;
};

/**
 * Fetch all home page data in one call
 */
export const fetchHomeData = async (): Promise<HomeData> => {
  const [banners, featuredProducts, flashSaleData, categories, categoriesWithProducts] = await Promise.all([
    fetchBanners(),
    fetchFeaturedProducts(),
    fetchActiveFlashSale(),
    fetchHomeCategories(),
    fetchCategoriesWithProducts(5, 5),
  ]);

  return {
    banners,
    featuredProducts,
    flashSale: flashSaleData.flashSale,
    flashSaleProducts: flashSaleData.products,
    categories,
    categoriesWithProducts,
  };
};

/**
 * Fetch top-level categories for home page display
 */
export const fetchHomeCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .is('parent_id', null) // Only top-level categories
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching home categories:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all categories
 */
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
};
