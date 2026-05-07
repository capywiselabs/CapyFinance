import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  await requireRole('student');
  const supabase = await createClient();
  const { data: items } = await supabase
    .from('shop_items')
    .select('id, sku, name_zh, name_en, price_coins, kind')
    .eq('active', true)
    .order('price_coins');

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold text-capy-700">商店</h1>
      <div className="grid grid-cols-2 gap-3">
        {(items ?? []).map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-2 p-4 text-center">
              <div className="text-3xl">🎁</div>
              <div className="font-semibold">{item.name_zh}</div>
              <div className="text-sm font-bold text-capy-700">{item.price_coins}🪙</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
