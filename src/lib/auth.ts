import { cookies } from 'next/headers';
import { getD1Database } from './db';

export interface User {
	id: string;
	username: string;
}

export interface Session {
	id: string;
	userId: string;
	token: string;
	expiresAt: string;
}

/**
 * 验证会话并返回用户信息
 */
export async function getCurrentUser(): Promise<User | null> {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get('session_token')?.value;

		if (!token) {
			console.log('[Auth] No session token found in cookies');
			return null;
		}

		console.log('[Auth] Found session token, length:', token.length);

		const db = getD1Database();
		if (!db) {
			console.error('[Auth] D1 database not available');
			throw new Error('D1 database not available');
		}

		const session = await db
			.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")')
			.bind(token)
			.first<Session>();

		if (!session) {
			console.log('[Auth] Session not found or expired for token');
			return null;
		}

		console.log('[Auth] Session found, userId:', session.userId);

		const user = await db
			.prepare('SELECT id, username FROM users WHERE id = ?')
			.bind(session.userId)
			.first<User>();

		if (!user) {
			console.error('[Auth] User not found for userId:', session.userId);
			return null;
		}

		console.log('[Auth] User found:', user.username);
		return user;
	} catch (error) {
		console.error('[Auth] Error getting current user:', error);
		if (error instanceof Error) {
			console.error('[Auth] Error message:', error.message);
			console.error('[Auth] Error stack:', error.stack);
		}
		throw error; // 重新抛出错误，让调用者处理
	}
}

/**
 * 创建会话
 */
export async function createSession(userId: string): Promise<string> {
	try {
		const db = getD1Database();
		const token = crypto.randomUUID();
		const sessionId = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7天后过期

		console.log('[Auth] Creating session:', {
			sessionId,
			userId,
			tokenLength: token.length,
			expiresAt,
		});

		const result = await db
			.prepare('INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
			.bind(sessionId, userId, token, expiresAt)
			.run();

		console.log('[Auth] Session created successfully:', {
			success: result.success,
			meta: result.meta,
		});

		// 验证会话是否真的被保存
		const verifySession = await db
			.prepare('SELECT * FROM sessions WHERE token = ?')
			.bind(token)
			.first();

		if (!verifySession) {
			console.error('[Auth] Session was not saved to database!');
			throw new Error('Failed to save session to database');
		}

		console.log('[Auth] Session verified in database');
		return token;
	} catch (error) {
		console.error('[Auth] Error creating session:', error);
		if (error instanceof Error) {
			console.error('[Auth] Error message:', error.message);
			console.error('[Auth] Error stack:', error.stack);
		}
		throw error;
	}
}

/**
 * 删除会话
 */
export async function deleteSession(token: string): Promise<void> {
	const db = getD1Database();
	await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

/**
 * 验证用户名和密码
 */
export async function verifyCredentials(username: string, password: string): Promise<User | null> {
	const db = getD1Database();
	const user = await db
		.prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
		.bind(username)
		.first<{ id: string; username: string; password_hash: string }>();

	if (!user) {
		return null;
	}

	// 验证密码（使用 bcrypt）
	const bcrypt = await import('bcryptjs');
	const isValid = await bcrypt.compare(password, user.password_hash);

	if (!isValid) {
		return null;
	}

	return { id: user.id, username: user.username };
}

