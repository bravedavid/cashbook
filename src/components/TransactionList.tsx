'use client';

import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import { Trash2, Edit2 } from 'lucide-react';

interface TransactionListProps {
	transactions: Transaction[];
	onDelete: (id: string) => void;
	onEdit?: (transaction: Transaction) => void;
}

export default function TransactionList({ transactions, onDelete, onEdit }: TransactionListProps) {
	const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
	const getCategory = (id: string) => allCategories.find((c) => c.id === id);

	if (transactions.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500 dark:text-gray-400">
				<p>暂无记录</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{transactions.map((transaction) => {
				const category = getCategory(transaction.category);
				const isIncome = transaction.type === 'income';

				return (
					<div
						key={transaction.id}
						className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex items-center justify-between"
					>
						<div className="flex items-center gap-4 flex-1">
							<div
								className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
								style={{ backgroundColor: category?.color + '20' }}
							>
								{category?.icon || '💰'}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="font-medium text-gray-900 dark:text-white">{category?.name || '未知'}</span>
									<span
										className={`text-xs px-2 py-0.5 rounded ${
											isIncome
												? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
												: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
										}`}
									>
										{isIncome ? '收入' : '支出'}
									</span>
								</div>
								{transaction.description && (
									<p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{transaction.description}</p>
								)}
								{transaction.note && (
									<p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic truncate" title={transaction.note}>
										备注: {transaction.note}
									</p>
								)}
								<p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(transaction.date)}</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<span
								className={`text-lg font-bold ${
									isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
								}`}
							>
								{isIncome ? '+' : '-'}
								{formatCurrency(transaction.amount)}
							</span>
							<div className="flex items-center gap-2">
								{onEdit && (
									<button
										onClick={() => onEdit(transaction)}
										className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500 hover:text-blue-600 transition-colors"
										title="编辑"
									>
										<Edit2 className="w-5 h-5" />
									</button>
								)}
								<button
									onClick={() => onDelete(transaction.id)}
									className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 hover:text-red-600 transition-colors"
									title="删除"
								>
									<Trash2 className="w-5 h-5" />
								</button>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

