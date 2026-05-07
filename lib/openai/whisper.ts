import 'server-only';
import { toFile } from 'openai/uploads';
import { getOpenAI, MODELS, estimateCostUsd } from './client';
import { ReceiptExtraction, receiptExtractionJsonSchema } from './schemas';
import { VOICE_SYSTEM_PROMPT } from './prompts';

export type TranscribeResult = {
  text: string;
  durationSec: number;
  costUsd: number;
};

export async function transcribeAudio(
  blob: Blob,
  filename = 'audio.webm',
): Promise<TranscribeResult> {
  const client = getOpenAI();
  const file = await toFile(blob, filename);
  const result = await client.audio.transcriptions.create({
    file,
    model: MODELS.whisper,
    language: 'yue',
    response_format: 'verbose_json',
  });

  const text = (result as unknown as { text: string }).text ?? '';
  const durationSec = (result as unknown as { duration?: number }).duration ?? 0;
  const costUsd = estimateCostUsd(MODELS.whisper, 0, 0, {
    audioMinutes: durationSec / 60,
  });
  return { text, durationSec, costUsd };
}

export async function parseSpokenExpense(transcript: string): Promise<ReceiptExtraction> {
  const client = getOpenAI();
  const response = await client.chat.completions.create({
    model: MODELS.parser,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'ReceiptExtraction',
        schema: receiptExtractionJsonSchema as Record<string, unknown>,
        strict: false,
      },
    },
    messages: [
      { role: 'system', content: VOICE_SYSTEM_PROMPT },
      { role: 'user', content: transcript },
    ],
    temperature: 0,
  });
  const raw = response.choices[0]?.message.content ?? '{}';
  return ReceiptExtraction.parse(JSON.parse(raw));
}
