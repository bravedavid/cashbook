'use client';

import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface StatsCardProps {
	title: string;
	amount: number;
	type: 'income' | 'expense' | 'balance';
}

export default function StatsCard({ title, amount, type }: StatsCardProps) {
	const colors = {
		income: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
		expense: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
		balance: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
	};

	const textColors = {
		income: 'text-green-600 dark:text-green-400',
		expense: 'text-red-600 dark:text-red-400',
		balance: 'text-blue-600 dark:text-blue-400',
	};

	const icons = {
		income: TrendingUp,
		expense: TrendingDown,
		balance: Wallet,
	};

	const Icon = icons[type];

	return (
		<div className={`${colors[type]} border rounded-xl p-6`}>
			<div className="flex items-center justify-between mb-2">
				<span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
				<Icon className={`w-5 h-5 ${textColors[type]}`} />
			</div>
			<div className={`text-2xl font-bold ${textColors[type]}`}>{formatCurrency(amount)}</div>
		</div>
	);
}

