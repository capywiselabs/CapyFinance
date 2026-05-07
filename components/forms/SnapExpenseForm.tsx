'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestExpenseUpload } from '@/app/(student)/expenses/actions';

type Status = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export function SnapExpenseForm({ onLogged }: { onLogged: (result: unknown) => void }) {
  const t = useTranslations('expense');
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus('uploading');
    setError(null);
    try {
      const upload = await requestExpenseUpload({
        contentType: file.type || 'image/jpeg',
        kind: 'receipt',
      });

      const putRes = await fetch(upload.signedUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type || 'image/jpeg' },
        body: file,
      });
      if (!putRes.ok) throw new Error('upload_failed');

      setStatus('analyzing');
      const res = await fetch('/api/expenses/photo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expenseId: upload.expenseId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setStatus('done');
      onLogged(json);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'unknown');
    }
  }

  return (
    <div className="space-y-3 text-center">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        size="xl"
        className="w-full"
        onClick={() => fileRef.current?.click()}
        disabled={status === 'uploading' || status === 'analyzing'}
      >
        <Camera className="mr-2 h-5 w-5" aria-hidden />
        {status === 'uploading'
          ? '上載緊張相...'
          : status === 'analyzing'
            ? 'AI 識緊...'
            : t('snap')}
      </Button>
      <p className="text-xs text-muted-foreground">{t('deletePhoto', { days: 14 })}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
