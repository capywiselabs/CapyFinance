'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CreateChildForm() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await fetch('/api/family/create-child', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: name, pin }),
    });
    if (!res.ok) {
      setErr(await res.text());
    } else {
      const j = await res.json();
      setMsg(`已加入 ${j.displayName}。家庭代碼:${j.familyCode}`);
      setName('');
      setPin('');
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-2xl border bg-card p-4">
      <h2 className="font-bold">新增小朋友</h2>
      <Input
        placeholder="暱稱"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        placeholder="4 位 PIN"
        required
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
      />
      {err && <p className="text-sm text-destructive">{err}</p>}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      <Button type="submit" disabled={busy}>加入</Button>
    </form>
  );
}
