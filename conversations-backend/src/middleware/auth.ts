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
			return c.json({ error: 'Failed to initialize auth service' }, 500);
		}
	};
}

export function authMiddleware() {
	return async (c: Context<HonoEnv>, next: Next) => {
		let token = c.req.query('token');
		if (!token) token = (await c.req.json()).token;
		if (!token) return c.json({ error: 'Token required' }, 401);
		const authService = c.get('authService');
		const user = await authService.verifyToken(token);
		console.log('authUser', user);
		c.set('authUser', user);
		await next();
	};
}
