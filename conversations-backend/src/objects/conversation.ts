import { DurableObject } from 'cloudflare:workers';

export interface Message {
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
	  }
	| {
			type: 'start_typing';
			data: { userId: string };
	  }
	| {
			type: 'stop_typing';
			data: { userId: string };
	  }
	| {
			type: 'ping';
	  }
	| {
			type: 'welcome';
	  };

export class ConversationObject extends DurableObject<Env> {
	private participants: Map<string, WebSocket> = new Map();
	private heartbeatIntervals: Map<string, number> = new Map();
	private typingTimeouts: Map<string, number> = new Map();
	private typingUsers: Map<string, number> = new Map(); // userId -> timestamp

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.initialize();
	}

	async initialize() {
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

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.ctx.acceptWebSocket(server);
		this.participants.set(userId, server);
		this.startHeartbeat(userId, server);

		const recentMessages = await this.getRecentMessages(50);
		await this.broadcastToUser(userId, {
			type: 'history',
			data: recentMessages,
		});
		await this.broadcastToUser(userId, {
			type: 'welcome',
		});

		await this.broadcastToOthers(userId, {
			type: 'user_joined',
			data: { userId },
		});

		server.addEventListener('close', async () => {
			this.cleanupUser(userId);
		});

		server.addEventListener('error', (error) => {
			this.cleanupUser(userId);
		});

		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	private startHeartbeat(userId: string, ws: WebSocket) {
		const interval = setInterval(() => this.broadcastToAll({ type: 'ping' }), 5000);
		this.heartbeatIntervals.set(userId, interval as any);
	}

	private cleanupUser(userId: string) {
		const interval = this.heartbeatIntervals.get(userId);
		if (interval) {
			clearInterval(interval);
			this.heartbeatIntervals.delete(userId);
		}

		// Clean up typing indicators
		const typingTimeout = this.typingTimeouts.get(userId);
		if (typingTimeout) {
			clearTimeout(typingTimeout);
			this.typingTimeouts.delete(userId);
		}
		this.typingUsers.delete(userId);

		this.participants.delete(userId);

		this.broadcastToOthers(userId, {
			type: 'user_left',
			data: { userId },
		});
	}

	async getRecentMessages(limit: number = 50): Promise<Message[]> {
		const cursor = this.ctx.storage.sql.exec(
			`
			SELECT id, userId, content, timestamp
			FROM messages
			ORDER BY timestamp DESC
			LIMIT ?
		`,
			limit
		);

		return cursor.toArray().reverse() as unknown as Message[];
	}

	async broadcastToUser(userId: string, message: WebsocketMessage) {
		const messageStr = JSON.stringify(message);
		const ws = this.participants.get(userId);
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(messageStr);
		}
	}

	async broadcastToAll(message: WebsocketMessage) {
		const messageStr = JSON.stringify(message);
		this.participants.forEach((ws, userId) => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(messageStr);
			} else {
				this.cleanupUser(userId);
			}
		});
	}

	async broadcastToOthers(excludeUserId: string, message: WebsocketMessage) {
		const messageStr = JSON.stringify(message);
		this.participants.forEach((ws, userId) => {
			if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
				ws.send(messageStr);
			}
		});
	}

	async storeMessage(message: Message) {
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
		await this.broadcastToAll({
			type: 'message',
			data: message,
		});
	}

	async getInfo(): Promise<{ participantCount: number; messageCount: number }> {
		const cursor = this.ctx.storage.sql.exec<{ count: number }>(`
			SELECT COUNT(*) as count FROM messages
		`);
		const row = cursor.one();

		return {
			participantCount: this.participants.size,
			messageCount: row?.count || 0,
		};
	}

	async getParticipants(): Promise<string[]> {
		return Array.from(this.participants.keys());
	}

	async getMessages(limit: number = 50, offset: number = 0): Promise<Message[]> {
		const cursor = this.ctx.storage.sql.exec(
			`
			SELECT id, userId, content, timestamp
			FROM messages
			ORDER BY timestamp DESC
			LIMIT ? OFFSET ?
		`,
			limit,
			offset
		);

		return cursor.toArray().reverse() as unknown as Message[];
	}

	async handleTyping(userId: string) {
		const now = Date.now();
		const wasTyping = this.typingUsers.has(userId);

		// Update the typing timestamp
		this.typingUsers.set(userId, now);

		// Clear existing timeout for this user
		const existingTimeout = this.typingTimeouts.get(userId);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		// Set new timeout to stop typing after 5 seconds
		const timeout = setTimeout(() => {
			this.stopTyping(userId);
		}, 5000) as any;

		this.typingTimeouts.set(userId, timeout);

		// If user wasn't typing before, broadcast start_typing
		if (!wasTyping) {
			await this.broadcastToOthers(userId, {
				type: 'start_typing',
				data: { userId },
			});
		}
	}

	async stopTyping(userId: string) {
		// Clear timeout
		const timeout = this.typingTimeouts.get(userId);
		if (timeout) {
			clearTimeout(timeout);
			this.typingTimeouts.delete(userId);
		}

		// Remove from typing users
		this.typingUsers.delete(userId);

		// Broadcast stop_typing
		await this.broadcastToOthers(userId, {
			type: 'stop_typing',
			data: { userId },
		});
	}
}
