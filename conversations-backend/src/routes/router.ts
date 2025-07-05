import { Context, Hono, Next } from 'hono';
import { cors } from 'hono/cors';
import counterApp, { AppRoutes as CounterRoutes } from './counter';
import thingsApp, { AppRoutes as ThingsRoutes } from './things';

export type DurableObjectStubs = {
	[K in keyof Env]: Env[K] extends DurableObjectNamespace<infer D> ? DurableObjectStub<D> : never;
};

export interface HonoEnv {
	Bindings: Env;
	Variables: DurableObjectStubs;
}

export function durableObjectMiddleware(doName: keyof DurableObjectStubs) {
	return async (c: Context<HonoEnv>, next: Next) => {
		const id: DurableObjectId = c.env[doName].idFromName('foo');
		const stub = c.env[doName].get(id);
		c.set(doName, stub);
		await next();
	};
}

const app = new Hono<HonoEnv>();

app.use(
	cors({
		origin: '*', // allow from any origin
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type'],
	})
);

app.route('/', counterApp);
app.route('/', thingsApp);

app.notFound((c) => c.json({ error: 'Not Found :o' }, 404));

export type AppRoutes = CounterRoutes | ThingsRoutes;

export default app;
