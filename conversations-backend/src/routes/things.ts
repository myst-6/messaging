import { durableObjectMiddleware, HonoEnv } from './router';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import z from 'zod';

type NotDisposable<T> = T extends infer R & Disposable ? R : T;

const app = new Hono<HonoEnv>().basePath('/things');

app.use(durableObjectMiddleware('THINGS_DO'));

export const routes = {
	create: app.post('/create', zValidator('json', z.object({ content: z.string() })), async (c) => {
		const content = c.req.valid('json').content;
		const thing = await c.get('THINGS_DO').createThing(content);
		return c.json({
			thing,
		});
	}),
	fetch: app.get('/fetch', async (c) => {
		const things = await c.get('THINGS_DO').listThings();
		return c.json({
			things: things as NotDisposable<typeof things>,
		});
	}),
	update: app.put('/update', zValidator('json', z.object({ id: z.number(), content: z.string() })), async (c) => {
		const { id, content } = c.req.valid('json');
		const success = await c.get('THINGS_DO').updateThing(id, content);
		return c.json({ success });
	}),
	delete: app.delete('/delete', zValidator('json', z.object({ id: z.number() })), async (c) => {
		const { id } = c.req.valid('json');
		const success = await c.get('THINGS_DO').deleteThing(id);
		return c.json({ success });
	}),
};

export type AppRoutes = (typeof routes)[keyof typeof routes];

export default app;
