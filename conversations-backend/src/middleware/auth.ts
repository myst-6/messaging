import { Context, Next } from 'hono';
import { AuthService } from '../services/auth';
import { createDb } from '../db';
import { HonoEnv } from '../routes/router';

export interface AuthContext {
	user: {
		userId: string;
		username: string;
	};
}

export function authServiceMiddleware() {
	return async (c: Context<HonoEnv>, next: Next) => {
		try {
			const db = createDb(c.env.DB);
			let jwtSecret: string = 'dev-secret';
			try {
				jwtSecret = await c.env.JWT_SECRET.get();
			} catch (error) {}
			const authService = new AuthService(db, jwtSecret);
			c.set('authService', authService);
			await next();
		} catch (error) {
			return c.json({ error: 'Invalid token' }, 401);
		}
	};
}

export function authMiddleware() {
	return async (c: Context<HonoEnv>, next: Next) => {
		const authHeader = c.req.header('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) return c.json({ error: 'Authorization header required' }, 401);
		const token = authHeader.substring(7); // Remove 'Bearer ' prefix
		const authService = c.get('authService');
		const user = await authService.verifyToken(token);
		c.set('authUser', user);
		await next();
	};
}
