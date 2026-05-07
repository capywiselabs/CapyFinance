import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { Capy } from '@/components/capy/Capy';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function PetPage() {
  const profile = await requireRole('student');
  const supabase = await createClient();
  await supabase.rpc('tick_pet', { p_pet_id: profile.id }).select();

  const { data: pet } = await supabase
    .from('pets')
    .select('name, level, xp, hp, happiness, hunger, coins')
    .eq('student_id', profile.id)
    .maybeSingle();

  const mood: 'happy' | 'sad' | 'sleepy' =
    !pet || pet.happiness > 60 ? 'happy' : pet.hp < 30 ? 'sleepy' : 'sad';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-capy-700">{pet?.name ?? 'Capy'}</h1>
      <div className="flex justify-center">
        <Capy size={220} mood={mood} />
      </div>
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Lv" value={pet?.level ?? 1} />
            <Stat label="HP" value={pet?.hp ?? 0} />
            <Stat label="Happy" value={pet?.happiness ?? 0} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-capy-50 p-3">
      <div className="text-xs uppercase text-capy-700">{label}</div>
      <div className="text-2xl font-extrabold text-capy-700">{value}</div>
    </div>
  );
}
