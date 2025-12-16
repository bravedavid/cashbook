import { Transaction } from '@/types';
import { getD1Database } from './db';

/**
 * 获取当前用户的所有交易记录
 */
export async function getTransactions(userId: string): Promise<Transaction[]> {
	const db = getD1Database();
	const result = await db
		.prepare('SELECT id, type, amount, category, description, note, date, created_at as createdAt FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
		.bind(userId)
		.all<Transaction>();

	return result.results || [];
}

/**
 * 添加交易记录
 */
export async function addTransaction(
	userId: string,
	transaction: Omit<Transaction, 'id' | 'createdAt' | 'user_id'>
): Promise<Transaction> {
	const db = getD1Database();
	const id = crypto.randomUUID();
	const createdAt = new Date().toISOString();

	await db
		.prepare(
			'INSERT INTO transactions (id, user_id, type, amount, category, description, note, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(id, userId, transaction.type, transaction.amount, transaction.category, transaction.description || '', transaction.note || null, transaction.date, createdAt)
		.run();

	return {
		id,
		...transaction,
		createdAt,
	};
}

/**
 * 删除交易记录
 */
export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
	const db = getD1Database();
	await db
		.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
		.bind(transactionId, userId)
		.run();
}

/**
 * 更新交易记录
 */
export async function updateTransaction(
	userId: string,
	transactionId: string,
	updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'user_id'>>
): Promise<void> {
	const db = getD1Database();
	const fields: string[] = [];
	const values: unknown[] = [];

	if (updates.type !== undefined) {
		fields.push('type = ?');
		values.push(updates.type);
	}
	if (updates.amount !== undefined) {
		fields.push('amount = ?');
		values.push(updates.amount);
	}
	if (updates.category !== undefined) {
		fields.push('category = ?');
		values.push(updates.category);
	}
	if (updates.description !== undefined) {
		fields.push('description = ?');
		values.push(updates.description);
	}
	if (updates.note !== undefined) {
		fields.push('note = ?');
		values.push(updates.note || null);
	}
	if (updates.date !== undefined) {
		fields.push('date = ?');
		values.push(updates.date);
	}

	if (fields.length === 0) {
		return;
	}

	await db
		.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`)
		.bind(...values, transactionId, userId)
		.run();
}

