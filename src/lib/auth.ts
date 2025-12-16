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
			return null;
		}

		const db = getD1Database();
		const session = await db
			.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")')
			.bind(token)
			.first<Session>();

		if (!session) {
			return null;
		}

		const user = await db
			.prepare('SELECT id, username FROM users WHERE id = ?')
			.bind(session.userId)
			.first<User>();

		return user || null;
	} catch (error) {
		console.error('Error getting current user:', error);
		return null;
	}
}

/**
 * 创建会话
 */
export async function createSession(userId: string): Promise<string> {
	const db = getD1Database();
	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7天后过期

	await db
		.prepare('INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
		.bind(crypto.randomUUID(), userId, token, expiresAt)
		.run();

	return token;
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

