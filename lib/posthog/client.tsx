'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

let inited = false;

export function PostHogInit() {
  useEffect(() => {
    if (inited) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      api_host: '/ingest',
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
    });
    inited = true;
  }, []);
  return null;
}
