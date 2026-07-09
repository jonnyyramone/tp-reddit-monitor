import { Hono } from 'hono';
import { context, redis } from '@devvit/web/server';
import type { QueueResponse } from '../../shared/api';
import { scanAllSubreddits } from '../core/scan';
import { CACHE_KEY } from '../core/config';
import type { Thread } from '../core/score';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

async function loadFromCache(): Promise<Thread[] | null> {
  const raw = await redis.get(CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Thread[];
  } catch {
    return null;
  }
}

async function saveToCache(threads: Thread[]): Promise<void> {
  await redis.set(CACHE_KEY, JSON.stringify(threads));
}

api.get('/queue', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      { status: 'error', message: 'postId missing' },
      400
    );
  }

  let threads = await loadFromCache();
  let fromCache = true;

  if (!threads) {
    try {
      threads = await scanAllSubreddits();
      await saveToCache(threads);
      fromCache = false;
    } catch (err) {
      console.error('[api/queue] scan failed:', err);
      return c.json<ErrorResponse>(
        { status: 'error', message: String(err) },
        500
      );
    }
  }

  return c.json<QueueResponse>({
    type: 'queue',
    postId,
    fromCache,
    threads,
  });
});

api.post('/refresh', async (c) => {
  try {
    const threads = await scanAllSubreddits();
    await saveToCache(threads);
    return c.json<QueueResponse>({
      type: 'queue',
      postId: context.postId ?? '',
      fromCache: false,
      threads,
    });
  } catch (err) {
    console.error('[api/refresh] failed:', err);
    return c.json<ErrorResponse>(
      { status: 'error', message: String(err) },
      500
    );
  }
});