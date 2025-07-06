import { eq } from 'drizzle-orm';
import { Database } from '../db';
import { users } from '../db/schema';

export interface RegisterRequest {
	username: string;
	password: string;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface AuthUser {
	userId: number;
	username: string;
}

export interface AuthResponse {
	token: string;
	user: AuthUser;
}

// Web Crypto API password hashing functions
async function hashPassword(password: string, salt: string): Promise<string> {
	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password + salt);

	const key = await crypto.subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveBits']);

	const hash = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: encoder.encode(salt),
			iterations: 100000, // High iteration count for security
			hash: 'SHA-256',
		},
		key,
		256 // 32 bytes = 256 bits
	);

	return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyPassword(password: string, salt: string, hashedPassword: string): Promise<boolean> {
	const computedHash = await hashPassword(password, salt);
	return computedHash === hashedPassword;
}

function generateSalt(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return btoa(String.fromCharCode(...array));
}

// Web Crypto API JWT functions
async function signJWT(payload: AuthUser, secret: string): Promise<string> {
	const header = { alg: 'HS256', typ: 'JWT' };
	const now = Math.floor(Date.now() / 1000);
	const exp = now + 24 * 60 * 60; // 24 hours

	const jwtPayload = {
		...payload,
		iat: now,
		exp: exp,
	};

	const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
	const encodedPayload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

	const data = encodedHeader + '.' + encodedPayload;
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);

	const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
	const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');

	return data + '.' + encodedSignature;
}

async function verifyJWT(token: string, secret: string): Promise<AuthUser> {
	const parts = token.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid token format');
	}

	const [encodedHeader, encodedPayload, encodedSignature] = parts;

	// Verify signature
	const data = encodedHeader + '.' + encodedPayload;
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);

	const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);

	// Decode signature
	const signature = Uint8Array.from(atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

	const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
	if (!isValid) {
		throw new Error('Invalid signature');
	}

	// Decode payload
	const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));

	// Check expiration
	if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
		throw new Error('Token expired');
	}

	return payload;
}

export class AuthService {
	constructor(private db: Database, private jwtSecret: string) {}

	async register(data: RegisterRequest): Promise<AuthResponse> {
		// Check if user already exists
		const existingUser = await this.db.select().from(users).where(eq(users.username, data.username)).limit(1);

		if (existingUser.length > 0) {
			throw new Error('Username already exists');
		}

		// Generate salt
		const salt = generateSalt();

		// Hash password with salt
		const hashedPassword = await hashPassword(data.password, salt);

		// Create user
		const [newUser] = await this.db
			.insert(users)
			.values({
				username: data.username,
				hashedPassword,
				salt,
			})
			.returning({ id: users.id, username: users.username });

		// Generate JWT
		const token = await signJWT({ userId: newUser.id, username: newUser.username }, this.jwtSecret);

		return {
			token,
			user: {
				userId: newUser.id,
				username: newUser.username,
			},
		};
	}

	async login(data: LoginRequest): Promise<AuthResponse> {
		// Find user by username
		const user = await this.db.select().from(users).where(eq(users.username, data.username)).limit(1);

		if (user.length === 0) {
			throw new Error('Invalid credentials');
		}

		const foundUser = user[0];

		// Verify password using the stored salt
		const isValidPassword = await verifyPassword(data.password, foundUser.salt, foundUser.hashedPassword);

		if (!isValidPassword) {
			throw new Error('Invalid credentials');
		}

		// Generate JWT
		const token = await signJWT({ userId: foundUser.id, username: foundUser.username }, this.jwtSecret);

		return {
			token,
			user: {
				userId: foundUser.id,
				username: foundUser.username,
			},
		};
	}

	async verifyToken(token: string): Promise<AuthUser> {
		try {
			const decoded = await verifyJWT(token, this.jwtSecret);
			return decoded;
		} catch (error) {
			throw new Error('Invalid token');
		}
	}
}
