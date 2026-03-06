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
 * Enrich products with lowest variant price.
 * For each product that has active variants, set sale_price to the lowest variant price
 * so that ProductCard and other components display the correct price (same as product detail).
 */
export const enrichProductsWithVariantPrices = async (products: Product[]): Promise<Product[]> => {
  if (!products || products.length === 0) return products;

  const productIds = products.map((p) => p.id);
  const { data: variantsData } = await (supabase as any)
    .from('product_variants')
    .select('product_id, price')
    .in('product_id', productIds)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('price', { ascending: true });

  if (!variantsData || variantsData.length === 0) return products;

  // Build map: product_id -> lowest variant price
  const priceMap: Record<string, number> = {};
  variantsData.forEach((v: any) => {
    if (v.product_id && !(v.product_id in priceMap)) {
      priceMap[v.product_id] = v.price;
    }
  });

  // Enrich products: use variant price as sale_price if available
  return products.map((p) => {
    const variantPrice = priceMap[p.id];
    if (variantPrice !== undefined) {
      return { ...p, sale_price: variantPrice } as Product;
    }
    return p;
  });
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

  return enrichProductsWithVariantPrices(data || []);
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

  const typedCategories = categories as Category[];

  // Fetch products for each category concurrently using Promise.all
  const categoryPromises = typedCategories.map(async (category) => {
    try {
      // Fetch subcategories
      const { data: subCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', category.id)
        .is('deleted_at', null)
        .eq('is_active', true);

      const categoryIds = [category.id, ...(subCategories?.map((c) => c.id) || [])];

      // Get product IDs from junction table for these categories
      const { data: junctionData, error: junctionError } = await supabase
        .from('product_categories_junction')
        .select('product_id')
        .in('category_id', categoryIds);

      if (junctionError || !junctionData || junctionData.length === 0) {
        return null;
      }

      const productIds = junctionData.map((j) => j.product_id);

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

      if (productsError || !products || products.length === 0) {
        return null;
      }

      const enrichedProducts = await enrichProductsWithVariantPrices(products);
      return {
        category,
        products: enrichedProducts,
      };
    } catch (e) {
      console.error(`Error fetching products for category ${category.name}:`, e);
      return null;
    }
  });

  const results = await Promise.all(categoryPromises);

  // Filter out nulls 
  const validResults = results.filter((r): r is CategoryWithProducts => r !== null);

  // Re-sort results to match the original category order
  const categoryOrderMap = Object.fromEntries(categories.map((c, i) => [c.id, i]));
  validResults.sort((a, b) => categoryOrderMap[a.category.id] - categoryOrderMap[b.category.id]);

  return validResults;
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
