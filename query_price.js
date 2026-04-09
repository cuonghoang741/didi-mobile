const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://brsigfliyzwlomomoxqu.supabase.co';
const supabaseKey = 'sb_publishable_yTnYgR3r8pmTlhOlt1zRHQ_IQO54sBe';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, base_price, sale_price')
    .ilike('name', '%iPhone 15 Pro Max 256GB%')
    .is('deleted_at', null);
  
  console.log('Products:', products);
  if (products && products.length > 0) {
    const { data: variants, error: vErr } = await supabase
      .from('product_variants')
      .select('id, product_id, name, price')
      .in('product_id', products.map(p => p.id));
    console.log('Variants:', variants);
  }
}
main();
