const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://brsigfliyzwlomomoxqu.supabase.co';
const supabaseKey = 'sb_publishable_yTnYgR3r8pmTlhOlt1zRHQ_IQO54sBe';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const pId = '15abb66d-aaa3-4181-9cb2-ed6d82f247fe';
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('product_id, price')
    .in('product_id', [pId])
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('price', { ascending: true });
    
  console.log('Error:', error);
  console.log('Variants found with filters:', variants);
}
main();
