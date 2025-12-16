import { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat('zh-CN', {
		style: 'currency',
		currency: 'CNY',
	}).format(amount);
};

export const formatDate = (date: string | Date): string => {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return format(dateObj, 'yyyy-MM-dd');
};

export const formatDateTime = (date: string | Date): string => {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	return format(dateObj, 'yyyy-MM-dd HH:mm');
};

export const getMonthTransactions = (transactions: Transaction[], date: Date): Transaction[] => {
	const start = startOfMonth(date);
	const end = endOfMonth(date);
	return transactions.filter((t) => {
		const transactionDate = new Date(t.date);
		return isWithinInterval(transactionDate, { start, end });
	});
};

export const getYearTransactions = (transactions: Transaction[], date: Date): Transaction[] => {
	const start = startOfYear(date);
	const end = endOfYear(date);
	return transactions.filter((t) => {
		const transactionDate = new Date(t.date);
		return isWithinInterval(transactionDate, { start, end });
	});
};

export const calculateTotal = (transactions: Transaction[], type: 'income' | 'expense'): number => {
	return transactions
		.filter((t) => t.type === type)
		.reduce((sum, t) => sum + t.amount, 0);
};

export const calculateBalance = (transactions: Transaction[]): number => {
	const income = calculateTotal(transactions, 'income');
	const expense = calculateTotal(transactions, 'expense');
	return income - expense;
};

export const groupByCategory = (transactions: Transaction[], type: 'income' | 'expense') => {
	const filtered = transactions.filter((t) => t.type === type);
	const grouped = filtered.reduce((acc, t) => {
		acc[t.category] = (acc[t.category] || 0) + t.amount;
		return acc;
	}, {} as Record<string, number>);
	return Object.entries(grouped).map(([category, amount]) => ({ category, amount }));
};

export const groupByDate = (transactions: Transaction[]) => {
	const grouped = transactions.reduce((acc, t) => {
		const date = formatDate(t.date);
		if (!acc[date]) {
			acc[date] = { income: 0, expense: 0 };
		}
		if (t.type === 'income') {
			acc[date].income += t.amount;
		} else {
			acc[date].expense += t.amount;
		}
		return acc;
	}, {} as Record<string, { income: number; expense: number }>);
	return Object.entries(grouped)
		.map(([date, values]) => ({ date, ...values }))
		.sort((a, b) => a.date.localeCompare(b.date));
};

