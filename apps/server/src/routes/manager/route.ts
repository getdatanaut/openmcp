import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>()
  /**
   * Configure a new Manager instance
   *
   * @example GET /manager
   */
  .get('/', async c => {
    return c.json({
      message: 'Welcome to OpenMCP Manager!',
    });
  });

export default app;
