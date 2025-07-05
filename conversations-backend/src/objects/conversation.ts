import { DurableObject } from 'cloudflare:workers';

export interface Message extends Record<string, SqlStorageValue> {
	id: string;
	userId: string;
	content: string;
	timestamp: number;
}

export type WebsocketMessage =
	| {
			type: 'history';
			data: Message[];
	  }
	| {
			type: 'message';
			data: Message;
	  }
	| {
			type: 'user_joined';
			data: { userId: string };
	  }
	| {
			type: 'user_left';
			data: { userId: string };
	  };

export class ConversationObject extends DurableObject<Env> {
	private participants: Map<string, WebSocket> = new Map();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.initialize();
	}

	initialize() {
		// Create the messages table if it doesn't exist
		this.ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS messages (
				id TEXT PRIMARY KEY,
				userId TEXT NOT NULL,
				content TEXT NOT NULL,
				timestamp INTEGER NOT NULL
			)
		`);
	}

	async fetch(request: Request): Promise<Response> {
		const reqUrl = new URL(request.url);
		const userId = reqUrl.searchParams.get('userId');
		if (!userId) {
			return new Response('User ID is required', { status: 400 });
		}

		// Creates two ends of a WebSocket connection.
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		// Accept the server WebSocket and store it in participants
		this.ctx.acceptWebSocket(server);
		this.participants.set(userId, server);

		// Send welcome message and recent messages
		const recentMessages = this.getRecentMessages(50);
		this.broadcastToUser(userId, {
			type: 'history',
			data: recentMessages,
		});
		this.broadcastToUser(userId, {
			type: 'message',
			data: {
				id: crypto.randomUUID(),
				userId: 'system',
				content: `Welcome ${userId}! You've joined the conversation.`,
				timestamp: Date.now(),
			},
		});

		// Notify other participants
		this.broadcastToOthers(userId, {
			type: 'user_joined',
			data: { userId },
		});

		// Handle incoming messages
		server.addEventListener('message', async (event) => {
			try {
				const data = JSON.parse(event.data as string);

				if (data.type === 'message') {
					const message: Message = {
						id: crypto.randomUUID(),
						userId,
						content: data.content,
						timestamp: Date.now(),
					};

					this.storeMessage(message);
				}
			} catch (error) {
				console.error('Error handling WebSocket message:', error);
				server.send(
					JSON.stringify({
						type: 'error',
						data: { message: 'Invalid message format' },
					})
				);
			}
		});

		// Handle WebSocket close
		server.addEventListener('close', () => {
			this.participants.delete(userId);
			this.broadcastToOthers(userId, {
				type: 'user_left',
				data: { userId },
			});
		});

		// Handle WebSocket errors
		server.addEventListener('error', (error) => {
			console.error('WebSocket error:', error);
			this.participants.delete(userId);
		});

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	getRecentMessages(limit: number = 50): Message[] {
		const cursor = this.ctx.storage.sql.exec<Message>(
			`
			SELECT id, userId, content, timestamp
			FROM messages
			ORDER BY timestamp DESC
			LIMIT ?
		`,
			limit
		);

		return cursor.toArray().reverse(); // Return in chronological order
	}

	broadcastToUser(userId: string, message: WebsocketMessage) {
		const messageStr = JSON.stringify(message);
		const ws = this.participants.get(userId);
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(messageStr);
		}
	}

	broadcastToAll(message: WebsocketMessage) {
		console.log('broadcasting to all', message);
		const messageStr = JSON.stringify(message);
		this.participants.forEach((ws) => {
			console.log('broadcasting to', ws.readyState);
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(messageStr);
			}
		});
	}

	broadcastToOthers(excludeUserId: string, message: WebsocketMessage) {
		const messageStr = JSON.stringify(message);
		this.participants.forEach((ws, userId) => {
			if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
				ws.send(messageStr);
			}
		});
	}

	// RPC method to store message
	storeMessage(message: Message) {
		this.ctx.storage.sql.exec(
			`
			INSERT INTO messages (id, userId, content, timestamp)
			VALUES (?, ?, ?, ?)
		`,
			message.id,
			message.userId,
			message.content,
			message.timestamp
		);
		this.broadcastToAll({
			type: 'message',
			data: message,
		});
	}

	// RPC method to get conversation info
	getInfo(): { participantCount: number; messageCount: number } {
		const cursor = this.ctx.storage.sql.exec<{ count: number }>(`
			SELECT COUNT(*) as count FROM messages
		`);
		const row = cursor.one();

		return {
			participantCount: this.participants.size,
			messageCount: row?.count || 0,
		};
	}

	// RPC method to get participants
	getParticipants(): string[] {
		return Array.from(this.participants.keys());
	}

	// RPC method to get messages
	getMessages(limit: number = 50, offset: number = 0): Message[] {
		const cursor = this.ctx.storage.sql.exec<Message>(
			`
			SELECT id, userId, content, timestamp
			FROM messages
			ORDER BY timestamp DESC
			LIMIT ? OFFSET ?
		`,
			limit,
			offset
		);

		return cursor.toArray().reverse(); // Return in chronological order
	}
}
