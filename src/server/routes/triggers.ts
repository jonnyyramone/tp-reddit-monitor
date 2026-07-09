import { Hono } from 'hono';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  return c.json({ status: 'success' }, 200);
});