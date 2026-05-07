import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const profile = await requireRole('student');
  const supabase = await createClient();
  const { data } = await supabase
    .from('tasks')
    .select('id, title, kind, reward_coins, status, due_at')
    .eq('assignee_id', profile.id)
    .neq('status', 'expired')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  const tasks = data ?? [];
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold text-capy-700">任務</h1>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">仲未有任務,過幾日睇下。</p>
      ) : (
        tasks.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t.title}</span>
                <span className="text-sm font-medium text-capy-700">+{t.reward_coins}🪙</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {t.kind === 'real' ? '真實任務' : t.kind === 'virtual_video' ? '睇片' : '問答'} ·{' '}
                {t.status}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
