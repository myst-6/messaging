import { Context, Hono, Next } from 'hono';
import { cors } from 'hono/cors';
import counterApp, { AppRoutes as CounterRoutes } from './counter';
import thingsApp, { AppRoutes as ThingsRoutes } from './things';
import conversationApp, { AppRoutes as ConversationRoutes } from './conversation';
import authApp, { AppRoutes as AuthRoutes } from './auth';
import { AuthService, AuthUser } from '../services/auth';
import { authServiceMiddleware } from '../middleware/auth';

export type DurableObjectStubs = {
	[K in keyof Env as Env[K] extends DurableObjectNamespace<any> ? K : never]: Env[K] extends DurableObjectNamespace<infer D>
		? DurableObjectStub<D>
		: never;
};

export interface HonoEnv {
	Bindings: Env;
	Variables: DurableObjectStubs & {
		authService: AuthService;
		authUser: AuthUser;
	};
}

const app = new Hono<HonoEnv>();

app.use(
	cors({
		origin: '*', // allow from any origin
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Upgrade'],
	})
);

app.use(authServiceMiddleware());

app.route('/', counterApp);
app.route('/', thingsApp);
app.route('/', conversationApp);
app.route('/', authApp);

app.notFound((c) => c.json({ error: 'Not Found :o' }, 404));

export type AppRoutes = CounterRoutes | ThingsRoutes | ConversationRoutes | AuthRoutes;

export default app;
