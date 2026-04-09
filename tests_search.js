const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://brsigfliyzwlomomoxqu.supabase.co';
const supabaseKey = 'sb_publishable_yTnYgR3r8pmTlhOlt1zRHQ_IQO54sBe';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  let query = supabase
    .from('products')
    .select('*')
    .ilike('name', `%15%`)
    .eq('status', 'active')
    .eq('is_active', true)
    .is('deleted_at', null);

  const { data: products, error } = await query.limit(20);
  
  if (!products || products.length === 0) {
    console.log('No products found');
    return;
  }
  
  console.log('Products mapped to base/sale price before enrich:', products.map(p => ({id: p.id, name: p.name, sale: p.sale_price})));

  const productIds = products.map((p) => p.id);
  const { data: variantsData } = await supabase
    .from('product_variants')
    .select('product_id, price')
    .in('product_id', productIds)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('price', { ascending: true });

  const priceMap = {};
  variantsData.forEach((v) => {
    if (v.product_id && !(v.product_id in priceMap)) {
      priceMap[v.product_id] = v.price;
    }
  });

  const enriched = products.map((p) => {
    const variantPrice = priceMap[p.id];
    if (variantPrice !== undefined) {
      return { ...p, sale_price: variantPrice };
    }
    return p;
  });

  console.log('Enriched products:', enriched.map(p => ({id: p.id, name: p.name, sale: p.sale_price, variantFound: priceMap[p.id] !== undefined})));
}

main();
