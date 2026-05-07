import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/openai/*', '@/lib/supabase/service'],
              message:
                'Server-only modules. Import from Route Handlers / Server Actions / Edge Functions only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'app/api/**/*.ts',
      'app/**/*.action.ts',
      'app/**/actions.ts',
      'lib/openai/**/*.ts',
      'lib/expenses/**/*.ts',
      'lib/supabase/service.ts',
      'lib/sendgrid/**/*.ts',
      'lib/posthog/server.ts',
      'supabase/functions/**/*.ts',
      'scripts/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
