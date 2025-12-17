import { Category } from '@/types';
import { getD1Database } from './db';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';

/**
 * 获取用户的所有分类（系统分类 + 自定义分类）
 */
export async function getUserCategories(userId: string, type: 'income' | 'expense'): Promise<Category[]> {
	const db = getD1Database();
	
	// 获取系统分类
	const systemCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
	
	// 获取用户自定义分类
	const customCategoriesResult = await db
		.prepare('SELECT id, name, icon, color FROM categories WHERE user_id = ? AND type = ?')
		.bind(userId, type)
		.all<Category>();
	
	const customCategories = customCategoriesResult.results || [];
	
	// 合并系统分类和自定义分类
	return [...systemCategories, ...customCategories];
}

/**
 * 添加自定义分类
 */
export async function addCategory(
	userId: string,
	category: Omit<Category, 'id'> & { type: 'income' | 'expense' }
): Promise<Category> {
	const db = getD1Database();
	const id = `custom-${crypto.randomUUID()}`;
	
	await db
		.prepare('INSERT INTO categories (id, user_id, type, name, icon, color) VALUES (?, ?, ?, ?, ?, ?)')
		.bind(id, userId, category.type, category.name, category.icon, category.color)
		.run();
	
	return {
		id,
		name: category.name,
		icon: category.icon,
		color: category.color,
	};
}

/**
 * 删除自定义分类
 */
export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
	const db = getD1Database();
	
	// 检查是否是自定义分类（系统分类不能删除）
	if (!categoryId.startsWith('custom-')) {
		throw new Error('不能删除系统分类');
	}
	
	// 检查是否有交易记录使用此分类
	const transactionsResult = await db
		.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND category = ?')
		.bind(userId, categoryId)
		.first<{ count: number }>();
	
	if (transactionsResult && transactionsResult.count > 0) {
		throw new Error(`该分类正在被 ${transactionsResult.count} 条交易记录使用，无法删除`);
	}
	
	await db
		.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
		.bind(categoryId, userId)
		.run();
}

/**
 * 更新自定义分类
 */
export async function updateCategory(
	userId: string,
	categoryId: string,
	updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
): Promise<void> {
	const db = getD1Database();
	
	// 检查是否是自定义分类
	if (!categoryId.startsWith('custom-')) {
		throw new Error('不能修改系统分类');
	}
	
	const fields: string[] = [];
	const values: unknown[] = [];
	
	if (updates.name !== undefined) {
		fields.push('name = ?');
		values.push(updates.name);
	}
	if (updates.icon !== undefined) {
		fields.push('icon = ?');
		values.push(updates.icon);
	}
	if (updates.color !== undefined) {
		fields.push('color = ?');
		values.push(updates.color);
	}
	
	if (fields.length === 0) {
		return;
	}
	
	await db
		.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`)
		.bind(...values, categoryId, userId)
		.run();
}

/**
 * 获取所有用户自定义分类
 */
export async function getAllUserCategories(userId: string): Promise<Category[]> {
	const db = getD1Database();
	const result = await db
		.prepare('SELECT id, name, icon, color, type FROM categories WHERE user_id = ?')
		.bind(userId)
		.all<Category & { type: 'income' | 'expense' }>();
	
	return result.results || [];
}

