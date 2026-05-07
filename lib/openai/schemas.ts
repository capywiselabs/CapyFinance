import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const ReceiptCurrency = z.enum(['HKD', 'CNY', 'USD', 'OTHER']);

export const ReceiptItem = z.object({
  name: z.string(),
  qty: z.number().nullable(),
  price: z.number().nullable(),
});

export const ReceiptExtraction = z.object({
  merchant: z.object({
    raw: z.string(),
    normalized: z.string(),
  }),
  amount: z.object({
    value: z.number().nonnegative(),
    currency: ReceiptCurrency,
  }),
  occurred_at: z.string().nullable(),
  items: z.array(ReceiptItem),
  payment_method: z.enum(['cash', 'octopus', 'card', 'mobile', 'unknown']).nullable(),
  confidence: z.object({
    merchant: z.number().min(0).max(1),
    amount: z.number().min(0).max(1),
    date: z.number().min(0).max(1),
  }),
  notes: z.string().nullable(),
});
export type ReceiptExtraction = z.infer<typeof ReceiptExtraction>;

export const CategorizeRequest = z.object({
  merchant: z.string(),
  notes: z.string().nullable(),
});

export const CATEGORY_SLUGS = [
  'transport',
  'groceries',
  'snacks',
  'food',
  'toys',
  'books',
  'health',
  'shopping',
  'other',
] as const;

export const CategorizeResult = z.object({
  category_slug: z.enum(CATEGORY_SLUGS),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});
export type CategorizeResult = z.infer<typeof CategorizeResult>;

export const ReportSummary = z.object({
  headline: z.string(),
  strengths: z.array(z.string()).length(3),
  growth_areas: z.array(z.string()).length(2),
  parent_tip: z.string(),
  conversation_starter: z.string(),
});
export type ReportSummary = z.infer<typeof ReportSummary>;

export const receiptExtractionJsonSchema = zodToJsonSchema(ReceiptExtraction, {
  name: 'ReceiptExtraction',
  $refStrategy: 'none',
});

export const categorizeResultJsonSchema = zodToJsonSchema(CategorizeResult, {
  name: 'CategorizeResult',
  $refStrategy: 'none',
});

export const reportSummaryJsonSchema = zodToJsonSchema(ReportSummary, {
  name: 'ReportSummary',
  $refStrategy: 'none',
});
