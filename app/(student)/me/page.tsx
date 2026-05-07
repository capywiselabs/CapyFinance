import { requireRole } from '@/lib/auth/guards';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const profile = await requireRole('student');
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold text-capy-700">我</h1>
      <Card>
        <CardHeader>
          <CardTitle>{profile.display_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
