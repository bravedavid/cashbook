import { Transaction } from '@/types';

const STORAGE_KEY = 'cashbook_transactions';

export const storage = {
	getTransactions: (): Transaction[] => {
		if (typeof window === 'undefined') return [];
		try {
			const data = localStorage.getItem(STORAGE_KEY);
			return data ? JSON.parse(data) : [];
		} catch {
			return [];
		}
	},

	saveTransactions: (transactions: Transaction[]): void => {
		if (typeof window === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
		} catch (error) {
			console.error('Failed to save transactions:', error);
		}
	},

	addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>): Transaction => {
		const transactions = storage.getTransactions();
		const newTransaction: Transaction = {
			...transaction,
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString(),
		};
		transactions.push(newTransaction);
		storage.saveTransactions(transactions);
		return newTransaction;
	},

	deleteTransaction: (id: string): void => {
		const transactions = storage.getTransactions();
		const filtered = transactions.filter((t) => t.id !== id);
		storage.saveTransactions(filtered);
	},

	updateTransaction: (id: string, updates: Partial<Transaction>): void => {
		const transactions = storage.getTransactions();
		const index = transactions.findIndex((t) => t.id === id);
		if (index !== -1) {
			transactions[index] = { ...transactions[index], ...updates };
			storage.saveTransactions(transactions);
		}
	},
};

