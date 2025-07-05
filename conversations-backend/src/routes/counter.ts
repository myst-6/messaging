import { Hono } from 'hono';
import { durableObjectMiddleware, HonoEnv } from './router';
import { zValidator } from '@hono/zod-validator';
import z from 'zod';

const app = new Hono<HonoEnv>().basePath('/counter');

app.use(durableObjectMiddleware('COUNTER_DO'));

export const routes = {
	increment: app.post('/increment', zValidator('json', z.object({ amount: z.number().optional().default(1) })), async (c) => {
		const amount = c.req.valid('json').amount;
		const counter = await c.get('COUNTER_DO').incrementBy(Number(amount));
		return c.json({
			counter,
		});
	}),
	fetch: app.get('/fetch', async (c) => {
		const counter = await c.get('COUNTER_DO').incrementBy(0);
		return c.json({
			counter,
		});
	}),
};

export type AppRoutes = (typeof routes)[keyof typeof routes];

export default app;
