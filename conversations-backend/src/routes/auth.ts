import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AuthService } from '../services/auth';
import { createDb } from '../db';
import { HonoEnv } from './router';
import { authServiceMiddleware } from '../middleware/auth';
import { User, users } from '../db/schema';
import { eq } from 'drizzle-orm';

const registerSchema = z.object({
	username: z.string().min(3).max(50),
	password: z.string().min(6).max(100),
});

const loginSchema = z.object({
	username: z.string().min(3).max(50),
	password: z.string().min(6).max(100),
});

const userSchema = z.object({
	userId: z.string().min(1),
});

const authApp = new Hono<HonoEnv>().basePath('/auth');

authApp.use(authServiceMiddleware());

const routes = [
	authApp.post('/register', zValidator('json', registerSchema), async (c) => {
		try {
			const { username, password } = c.req.valid('json');
			const authService = c.get('authService');
			const result = await authService.register({ username, password });

			return c.json({
				success: true,
				data: result,
			} as const);
		} catch (error) {
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : 'Registration failed',
				} as const,
				400
			);
		}
	}),
	authApp.post('/login', zValidator('json', loginSchema), async (c) => {
		try {
			const { username, password } = c.req.valid('json');
			const authService = c.get('authService');
			const result = await authService.login({ username, password });

			return c.json({
				success: true,
				data: result,
			} as const);
		} catch (error) {
			console.error(error);
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : 'Login failed',
				} as const,
				400
			);
		}
	}),
	authApp.post('/user', zValidator('json', userSchema), async (c) => {
		const { userId } = c.req.valid('json');
		const db = createDb(c.env.DB);
		const result = await db
			.select({
				userId: users.id,
				username: users.username,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users)
			.where(eq(users.id, Number(userId)))
			.limit(1);
		if (result.length === 0) {
			return c.json({ success: false, error: 'User not found' } as const, 404);
		}
		return c.json({ success: true, data: result[0] } as const);
	}),
] as const;

export type AppRoutes = (typeof routes)[number];

export default authApp;
