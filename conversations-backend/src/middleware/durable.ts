import { Context, Next } from 'hono';
import { DurableObjectStubs, HonoEnv } from '../routes/router';

export function durableObjectMiddleware(doName: keyof DurableObjectStubs) {
	return async (c: Context<HonoEnv>, next: Next) => {
		const id: DurableObjectId = c.env[doName].idFromName('foo');
		const stub = c.env[doName].get(id);
		c.set(doName, stub);
		await next();
	};
}
