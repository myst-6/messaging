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

export function conversationMiddleware() {
	return async (c: Context<HonoEnv>, next: Next) => {
		let conversationId = c.req.query('conversationId');
		if (!conversationId) {
			conversationId = (await c.req.json()).conversationId;
		}
		if (!conversationId) {
			return c.json({ error: 'Conversation ID is required' }, 400);
		}
		const durableObjectId = c.env['CONVERSATION_DO'].idFromName(conversationId);
		const stub = c.env['CONVERSATION_DO'].get(durableObjectId);
		console.log('durable object', durableObjectId);
		c.set('CONVERSATION_DO', stub);
		await next();
	};
}
