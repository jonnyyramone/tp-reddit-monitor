import { Hono } from 'hono';
import { redis } from '@devvit/web/server';
import { scanAllSubreddits } from '../core/scan';
import { CACHE_KEY } from '../core/config';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  return c.json({ status: 'success' }, 200);
});

triggers.post('/scheduled-scan', async (c) => {
  try {
    const threads = await scanAllSubreddits();
    await redis.set(CACHE_KEY, JSON.stringify(threads));
    return c.json(
      {
        success: true,
        summary: `Scanned ${threads.length} relevant threads`,
      },
      200
    );
  } catch (err) {
    console.error('[trigger/scheduled-scan] failed:', err);
    return c.json(
      {
        success: false,
        summary: `Scan failed: ${String(err)}`,
      },
      200
    );
  }
});