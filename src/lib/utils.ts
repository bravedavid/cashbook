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

// 清理分类ID，确保格式一致（去掉名称部分）
const cleanCategoryId = (categoryId: string): string => {
	if (!categoryId) return categoryId;
	
	// 处理自定义分类ID格式问题
	if (categoryId.startsWith('custom-')) {
		// 优先处理 custom-xxx:名称 格式（使用 : 分隔）
		const colonMatch = categoryId.match(/^(custom-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}):(.+)$/);
		if (colonMatch) {
			return colonMatch[1];
		}
		
		// 处理 custom-xxx-名称 格式（使用 - 分隔）
		// UUID格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（5段）
		// 自定义分类ID：custom-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（6段）
		const parts = categoryId.split('-');
		if (parts.length > 6) {
			// 提取前6段作为纯ID（custom + UUID的5段）
			return parts.slice(0, 6).join('-');
		}
	} else {
		// 对于系统分类，也可能有类似问题，尝试清理
		// 系统分类格式：id-名称 或 id:名称
		const systemMatch = categoryId.match(/^([a-z-]+)[-:](.+)$/);
		if (systemMatch) {
			// 检查是否是有效的系统分类ID
			const systemIds = ['salary', 'bonus', 'investment', 'gift', 'other-income', 'food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'other-expense'];
			if (systemIds.includes(systemMatch[1])) {
				return systemMatch[1];
			}
		}
	}
	
	return categoryId;
};

export const groupByCategory = (transactions: Transaction[], type: 'income' | 'expense') => {
	const filtered = transactions.filter((t) => t.type === type);
	const grouped = filtered.reduce((acc, t) => {
		const cleanId = cleanCategoryId(t.category);
		acc[cleanId] = (acc[cleanId] || 0) + t.amount;
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

export interface MonthlyGroup {
	monthKey: string; // '2024-01' format
	monthName: string; // '2024年1月' format
	transactions: Transaction[];
	income: number;
	expense: number;
	balance: number;
	count: number;
	dailyGroups: DailyGroup[]; // 新增：按天分组
}

export interface DailyGroup {
	date: string; // '2024-12-20' format
	dateDisplay: string; // '12月20日' format
	transactions: Transaction[];
	income: number;
	expense: number;
	balance: number;
	count: number;
}

export const groupTransactionsByMonth = (transactions: Transaction[]): MonthlyGroup[] => {
	const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	const grouped = sortedTransactions.reduce((acc, transaction) => {
		const date = new Date(transaction.date);
		const monthKey = format(date, 'yyyy-MM');
		const monthName = format(date, 'yyyy年M月');

		if (!acc[monthKey]) {
			acc[monthKey] = {
				monthKey,
				monthName,
				transactions: [],
				income: 0,
				expense: 0,
				balance: 0,
				count: 0,
				dailyGroups: [],
			};
		}

		acc[monthKey].transactions.push(transaction);
		acc[monthKey].count += 1;

		if (transaction.type === 'income') {
			acc[monthKey].income += transaction.amount;
		} else {
			acc[monthKey].expense += transaction.amount;
		}

		acc[monthKey].balance = acc[monthKey].income - acc[monthKey].expense;

		return acc;
	}, {} as Record<string, MonthlyGroup>);

	// 为每个月创建按天的分组
	const monthlyGroups = Object.values(grouped).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

	monthlyGroups.forEach(monthGroup => {
		const dailyGrouped = monthGroup.transactions.reduce((acc, transaction) => {
			const dateKey = formatDate(transaction.date);

			if (!acc[dateKey]) {
				const date = new Date(transaction.date);
				const dateDisplay = format(date, 'M月d日');
				acc[dateKey] = {
					date: dateKey,
					dateDisplay,
					transactions: [],
					income: 0,
					expense: 0,
					balance: 0,
					count: 0,
				};
			}

			acc[dateKey].transactions.push(transaction);
			acc[dateKey].count += 1;

			if (transaction.type === 'income') {
				acc[dateKey].income += transaction.amount;
			} else {
				acc[dateKey].expense += transaction.amount;
			}

			acc[dateKey].balance = acc[dateKey].income - acc[dateKey].expense;

			return acc;
		}, {} as Record<string, DailyGroup>);

		monthGroup.dailyGroups = Object.values(dailyGrouped).sort((a, b) => b.date.localeCompare(a.date));
	});

	return monthlyGroups;
};

