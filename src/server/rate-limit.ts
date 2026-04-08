import { getServerEnv } from './env';
import { RateLimitError } from './errors';

type Bucket = { count: number; resetAt: number };

const memoryStore = new Map<string, Bucket>();

export const enforceRateLimit = (key: string) => {
  const env = getServerEnv();
  const now = Date.now();
  const current = memoryStore.get(key);

  if (!current || current.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + env.RATE_LIMIT_WINDOW_MS });
    return;
  }

  if (current.count >= env.RATE_LIMIT_MAX_REQUESTS) {
    throw new RateLimitError();
  }

  current.count += 1;
  memoryStore.set(key, current);
};

export const _resetRateLimitStoreForTests = () => {
  memoryStore.clear();
};
