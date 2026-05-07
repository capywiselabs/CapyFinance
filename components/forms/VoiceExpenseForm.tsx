'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestExpenseUpload } from '@/app/(student)/expenses/actions';

type Status = 'idle' | 'recording' | 'uploading' | 'analyzing' | 'done' | 'error';

export function VoiceExpenseForm({ onLogged }: { onLogged: (result: unknown) => void }) {
  const t = useTranslations('expense');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = onStop;
      recorder.start();
      recorderRef.current = recorder;
      setStatus('recording');
    } catch {
      setStatus('error');
      setError('mic_permission');
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }

  async function onStop() {
    setStatus('uploading');
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const upload = await requestExpenseUpload({ contentType: 'audio/webm', kind: 'voice' });
      const putRes = await fetch(upload.signedUrl, {
        method: 'PUT',
        headers: { 'content-type': 'audio/webm' },
        body: blob,
      });
      if (!putRes.ok) throw new Error('upload_failed');

      setStatus('analyzing');
      const res = await fetch('/api/expenses/voice', {
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
      {status === 'recording' ? (
        <Button type="button" size="xl" variant="destructive" className="w-full" onClick={stop}>
          <Square className="mr-2 h-5 w-5" aria-hidden /> 停
        </Button>
      ) : (
        <Button
          type="button"
          size="xl"
          className="w-full"
          onClick={start}
          disabled={status === 'uploading' || status === 'analyzing'}
        >
          <Mic className="mr-2 h-5 w-5" aria-hidden />
          {status === 'uploading'
            ? '上載中...'
            : status === 'analyzing'
              ? 'AI 識緊...'
              : t('voice')}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        例:「我喺7仔買咗一支水8蚊」
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
