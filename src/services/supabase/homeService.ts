import type {
  Banner,
  Category,
  Product,
  FlashSale,
  ProductWithFlashSale,
} from '@/types/database.types';

import { supabase } from './client';

// === DEBUG: Test RLS on product_categories_junction ===
(async () => {
  try {
    // Test 1: Direct query to junction table (no filters)
    const { data: junctionAll, error: junctionErr, count } = await (supabase as any)
      .from('product_categories_junction')
      .select('*', { count: 'exact' })
      .limit(5);

    console.log('🔍 [RLS DEBUG] product_categories_junction query:', {
      dataLength: junctionAll?.length ?? 'null',
      totalCount: count,
      error: junctionErr,
      sampleData: junctionAll?.slice(0, 3),
    });

    // Test 2: Check categories
    const { data: catData } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .is('parent_id', null)
      .limit(5);

    console.log('🔍 [RLS DEBUG] Top-level categories:', catData?.map(c => ({ id: c.id, name: c.name })));

    if (catData && catData.length > 0) {
      // Test 3: Query junction with first category's ID
      const firstCatId = catData[0].id;
      const { data: junctionForCat, error: jErr } = await (supabase as any)
        .from('product_categories_junction')
        .select('product_id')
        .eq('category_id', firstCatId);

      console.log(`🔍 [RLS DEBUG] Junction for category "${catData[0].name}" (${firstCatId}):`, {
        dataLength: junctionForCat?.length ?? 'null',
        error: jErr,
        data: junctionForCat,
      });

      // Test 4: Also check subcategories
      const { data: subCats } = await supabase
        .from('categories')
        .select('id, name')
        .eq('parent_id', firstCatId)
        .is('deleted_at', null)
        .eq('is_active', true);

      console.log(`🔍 [RLS DEBUG] Subcategories of "${catData[0].name}":`, subCats);

      if (subCats && subCats.length > 0) {
        const allCatIds = [firstCatId, ...subCats.map(s => s.id)];
        const { data: junctionForAll, error: jErr2 } = await (supabase as any)
          .from('product_categories_junction')
          .select('product_id')
          .in('category_id', allCatIds);

        console.log(`🔍 [RLS DEBUG] Junction for category + subcategories:`, {
          categoryIds: allCatIds,
          dataLength: junctionForAll?.length ?? 'null',
          error: jErr2,
          data: junctionForAll,
        });
      }
    }
  } catch (e) {
    console.error('🔍 [RLS DEBUG] Error:', e);
  }
})();
// === END DEBUG ===

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
    // @ts-ignore: status column exists in DB but not in types
    .eq('status', 'active')
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

  console.log('[DEBUG fetchCategoriesWithProducts] Top-level categories found:', categories.length, categories.map(c => ({ id: c.id, name: c.name })));

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
    console.log(`[DEBUG] Category "${category.name}" (${category.id}) - subcategories:`, subCategories?.length || 0, '- all categoryIds:', categoryIds);

    // Get product IDs from junction table for these categories
    const { data: junctionData, error: junctionError } = await supabase
      .from('product_categories_junction')
      .select('product_id')
      .in('category_id', categoryIds);

    console.log(`[DEBUG] Junction query for category "${category.name}":`, {
      junctionData: junctionData?.length || 0,
      junctionError: junctionError,
      rawData: junctionData,
    });

    if (junctionError) {
      console.error('Error fetching product Junction:', junctionError);
      continue;
    }

    const productIds = junctionData?.map((j) => j.product_id) || [];

    if (productIds.length === 0) {
      console.log(`[DEBUG] No products found in junction for category "${category.name}" - skipping`);
      continue;
    }

    console.log(`[DEBUG] Product IDs for category "${category.name}":`, productIds);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      // @ts-ignore: status column exists in DB but not in types
      .eq('status', 'active')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(productLimit);

    console.log(`[DEBUG] Products query result for category "${category.name}":`, {
      productsCount: products?.length || 0,
      productsError: productsError,
    });

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
