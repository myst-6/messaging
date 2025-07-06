import { Context, Hono, Next } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Message } from '../objects/conversation';
import { HonoEnv } from './router';
import { authMiddleware, authServiceMiddleware } from '../middleware/auth';
import { conversationMiddleware } from '../middleware/durable';

const app = new Hono<HonoEnv>().basePath('/conversation');

app.use(authServiceMiddleware());
app.use(authMiddleware());
app.use(conversationMiddleware());

const sendMessageSchema = z.object({
	content: z.string().min(1),
	token: z.string().min(1),
	conversationId: z.string().min(1),
});

export type MessageDraft = Omit<z.infer<typeof sendMessageSchema>, 'token'>;

const routes = [
	app.get('/join', async (c) => {
		const userId = c.req.query('userId');
		if (!userId) {
			return c.json({ error: 'User ID is required' }, 400);
		}
		const authUser = c.get('authUser');
		if (authUser.userId.toString() !== userId) {
			return c.json({ error: 'User ID does not match token' }, 400);
		}

		const upgradeHeader = c.req.header('Upgrade');
		if (upgradeHeader !== 'websocket') {
			return c.json({ error: 'Expected WebSocket upgrade' }, 400);
		}

		return c.get('CONVERSATION_DO').fetch(c.req.raw);
	}),
	// app.get('/info', async (c) => {
	// 	const info = await c.get('CONVERSATION_DO').getInfo();
	// 	return c.json(info);
	// }),
	// app.get('/participants', async (c) => {
	// 	const participants = await c.get('CONVERSATION_DO').getParticipants();
	// 	return c.json({ participants });
	// }),
	// app.get('/messages', zValidator('query', getMessagesSchema), async (c) => {
	// 	const { limit, offset } = c.req.valid('query');
	// 	const messages = await c.get('CONVERSATION_DO').getMessages(limit, offset);
	// 	return c.json({ messages });
	// }),
	app.post('/messages', zValidator('json', sendMessageSchema), async (c) => {
		const { content } = c.req.valid('json');
		const authUser = c.get('authUser');
		const message: Message = {
			id: crypto.randomUUID(),
			userId: authUser.userId.toString(),
			content,
			timestamp: Date.now(),
		};
		await c.get('CONVERSATION_DO').storeMessage(message);
		return c.json({ success: true, message });
	}),
] as const;

export type AppRoutes = (typeof routes)[number];

export default app;
