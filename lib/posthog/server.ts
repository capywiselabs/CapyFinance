import 'server-only';
import { PostHog } from 'posthog-node';

class StubPostHog {
  capture(_args: { distinctId: string; event: string; properties?: Record<string, unknown> }) {
    void _args;
  }
  shutdown() {}
}

let instance: PostHog | StubPostHog | undefined;

export const posthogServer: { capture: StubPostHog['capture']; shutdown: StubPostHog['shutdown'] } =
  (() => {
    if (instance) return instance;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
    if (!key) {
      instance = new StubPostHog();
    } else {
      instance = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
    }
    return instance;
  })();
