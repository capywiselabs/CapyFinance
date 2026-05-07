import 'server-only';
import { getOpenAI, MODELS, estimateCostUsd } from './client';
import { ReceiptExtraction, receiptExtractionJsonSchema } from './schemas';
import { RECEIPT_SYSTEM_PROMPT } from './prompts';

export type OcrResult = {
  data: ReceiptExtraction;
  model: string;
  costUsd: number;
};

/**
 * Vision-based receipt OCR using gpt-4o with structured outputs.
 * `imageInput` can be a public URL or a data URL.
 */
export async function extractReceipt(imageInput: string): Promise<OcrResult> {
  const client = getOpenAI();

  const response = await client.chat.completions.create({
    model: MODELS.vision,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'ReceiptExtraction',
        schema: receiptExtractionJsonSchema as Record<string, unknown>,
        strict: false,
      },
    },
    messages: [
      { role: 'system', content: RECEIPT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract the receipt fields. Default currency to HKD if unspecified. Return JSON matching the schema.',
          },
          { type: 'image_url', image_url: { url: imageInput, detail: 'high' } },
        ],
      },
    ],
    temperature: 0,
  });

  const raw = response.choices[0]?.message.content ?? '{}';
  const parsed = ReceiptExtraction.parse(JSON.parse(raw));

  const usage = response.usage;
  const costUsd = estimateCostUsd(
    MODELS.vision,
    usage?.prompt_tokens ?? 0,
    usage?.completion_tokens ?? 0,
    { imageCount: 1 },
  );

  return { data: parsed, model: MODELS.vision, costUsd };
}
