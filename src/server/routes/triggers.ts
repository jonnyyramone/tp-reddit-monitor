import { Hono } from 'hono';
import { createPost } from '../core/post';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  try {
    const post = await createPost();
    return c.json(
      {
        status: 'success',
        message: `Queue post created: ${post.id}`,
      },
      200
    );
  } catch (err) {
    console.error('[trigger/on-app-install] failed:', err);
    return c.json(
      { status: 'error', message: String(err) },
      200
    );
  }
});