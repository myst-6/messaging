import { Context, Hono, Next } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Message } from '../objects/conversation';
import { HonoEnv } from './router';

const app = new Hono<HonoEnv>().basePath('/conversation');

app.use(async (c: Context<HonoEnv>, next: Next) => {
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
});

const getMessagesSchema = z.object({
	limit: z.string().transform(Number).default('50'),
	offset: z.string().transform(Number).default('0'),
});

const sendMessageSchema = z.object({
	userId: z.string(),
	content: z.string().min(1),
});

export type MessageDraft = z.infer<typeof sendMessageSchema>;

const routes = [
	app.get('/join', async (c) => {
		const userId = c.req.query('userId');
		if (!userId) {
			return c.json({ error: 'User ID is required' }, 400);
		}

		const upgradeHeader = c.req.header('Upgrade');
		if (upgradeHeader !== 'websocket') {
			return c.json({ error: 'Expected WebSocket upgrade' }, 400);
		}

		return c.get('CONVERSATION_DO').fetch(c.req.raw);
	}),
	app.get('/info', async (c) => {
		const info = await c.get('CONVERSATION_DO').getInfo();
		return c.json(info);
	}),
	app.get('/participants', async (c) => {
		const participants = await c.get('CONVERSATION_DO').getParticipants();
		return c.json({ participants });
	}),
	app.get('/messages', zValidator('query', getMessagesSchema), async (c) => {
		const { limit, offset } = c.req.valid('query');
		const messages = await c.get('CONVERSATION_DO').getMessages(limit, offset);
		return c.json({ messages });
	}),
	app.post('/messages', zValidator('json', sendMessageSchema), async (c) => {
		const { userId, content } = c.req.valid('json');
		const message: Message = {
			id: crypto.randomUUID(),
			userId,
			content,
			timestamp: Date.now(),
		};
		await c.get('CONVERSATION_DO').storeMessage(message);
		return c.json({ success: true, message });
	}),
] as const;

export type AppRoutes = (typeof routes)[number];

export default app;
