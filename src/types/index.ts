export type TransactionType = 'income' | 'expense';

export type Category = {
	id: string;
	name: string;
	icon: string;
	color: string;
};

export interface Transaction {
	id: string;
	type: TransactionType;
	amount: number;
	category: string;
	description: string;
	note?: string;
	date: string;
	createdAt: string;
}

export interface TransactionFormData {
	type: TransactionType;
	amount: string;
	category: string;
	description: string;
	note?: string;
	date: string;
}

export interface RecognitionResult {
	id: string;
	imageFile: File;
	imagePreview: string;
	status: 'pending' | 'processing' | 'success' | 'error';
	transactions?: TransactionItem[];
	error?: string;
}

export interface TransactionItem {
	date: string;
	amount: number;
	type: 'income' | 'expense';
	category: string;
	description: string;
	originalInfo?: string; // 原始交易信息，从银行流水识别出来的原始文本
}

export interface RecognitionResponse {
	success: boolean;
	transactions?: TransactionItem[];
	error?: string;
}

export interface AuthMeResponse {
	success: boolean;
	user?: { id: string; username: string };
	error?: string;
}

export interface TransactionsResponse {
	success: boolean;
	transactions?: Transaction[];
	error?: string;
}

export interface TransactionResponse {
	success: boolean;
	transaction?: Transaction;
	error?: string;
}

export interface DeleteResponse {
	success: boolean;
	error?: string;
}

export interface LoginResponse {
	success: boolean;
	error?: string;
	user?: { id: string; username: string };
}

export const INCOME_CATEGORIES: Category[] = [
	{ id: 'salary', name: '工资', icon: '💼', color: '#10b981' },
	{ id: 'bonus', name: '奖金', icon: '🎁', color: '#3b82f6' },
	{ id: 'investment', name: '投资', icon: '📈', color: '#8b5cf6' },
	{ id: 'gift', name: '礼物', icon: '🎁', color: '#ec4899' },
	{ id: 'other-income', name: '其他', icon: '💰', color: '#6b7280' },
];

export const EXPENSE_CATEGORIES: Category[] = [
	{ id: 'food', name: '餐饮', icon: '🍔', color: '#f59e0b' },
	{ id: 'transport', name: '交通', icon: '🚗', color: '#3b82f6' },
	{ id: 'shopping', name: '购物', icon: '🛍️', color: '#ec4899' },
	{ id: 'entertainment', name: '娱乐', icon: '🎬', color: '#8b5cf6' },
	{ id: 'bills', name: '账单', icon: '📄', color: '#ef4444' },
	{ id: 'health', name: '医疗', icon: '🏥', color: '#10b981' },
	{ id: 'education', name: '教育', icon: '📚', color: '#6366f1' },
	{ id: 'other-expense', name: '其他', icon: '💸', color: '#6b7280' },
];
