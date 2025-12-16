'use client';

import { useState } from 'react';
import { Transaction, TransactionFormData, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Trash2, Edit2, Check, X } from 'lucide-react';

interface TransactionListProps {
	transactions: Transaction[];
	onDelete: (id: string) => void;
	onUpdate?: (id: string, data: TransactionFormData) => void;
}

export default function TransactionList({ transactions, onDelete, onUpdate }: TransactionListProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editData, setEditData] = useState<TransactionFormData | null>(null);
	const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
	const getCategory = (id: string) => allCategories.find((c) => c.id === id);

	const handleStartEdit = (transaction: Transaction) => {
		setEditingId(transaction.id);
		setEditData({
			type: transaction.type,
			amount: transaction.amount.toString(),
			category: transaction.category,
			description: transaction.description,
			note: transaction.note || '',
			date: transaction.date,
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditData(null);
	};

	const handleSaveEdit = (id: string) => {
		if (editData && onUpdate) {
			onUpdate(id, editData);
			setEditingId(null);
			setEditData(null);
		}
	};

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
				const isEditing = editingId === transaction.id;
				const currentData = isEditing && editData ? editData : null;
				const categories = currentData?.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

				return (
					<div
						key={transaction.id}
						className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
					>
						{isEditing && currentData ? (
							// 编辑模式
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									{/* 类型 */}
									<div>
										<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => setEditData({ ...currentData, type: 'income', category: '' })}
												className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-all ${
													currentData.type === 'income'
														? 'bg-green-500 text-white'
														: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
												}`}
											>
												收入
											</button>
											<button
												type="button"
												onClick={() => setEditData({ ...currentData, type: 'expense', category: '' })}
												className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-all ${
													currentData.type === 'expense'
														? 'bg-red-500 text-white'
														: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
												}`}
											>
												支出
											</button>
										</div>
									</div>

									{/* 金额 */}
									<div>
										<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">金额</label>
										<input
											type="number"
											step="0.01"
											min="0"
											value={currentData.amount}
											onChange={(e) => setEditData({ ...currentData, amount: e.target.value })}
											className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										/>
									</div>
								</div>

								{/* 分类 */}
								<div>
									<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">分类</label>
									<div className="grid grid-cols-4 gap-2">
										{categories.map((cat) => (
											<button
												key={cat.id}
												type="button"
												onClick={() => setEditData({ ...currentData, category: cat.id })}
												className={`p-2 rounded-lg border-2 transition-all text-xs ${
													currentData.category === cat.id
														? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
														: 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
												}`}
											>
												<div className="text-lg mb-0.5">{cat.icon}</div>
												<div className="text-gray-700 dark:text-gray-300">{cat.name}</div>
											</button>
										))}
									</div>
								</div>

								{/* 描述 */}
								<div>
									<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
									<input
										type="text"
										value={currentData.description}
										onChange={(e) => setEditData({ ...currentData, description: e.target.value })}
										className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										placeholder="简要描述"
									/>
								</div>

								{/* 备注 */}
								<div>
									<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
									<textarea
										value={currentData.note || ''}
										onChange={(e) => setEditData({ ...currentData, note: e.target.value })}
										className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
										placeholder="备注信息"
										rows={2}
									/>
								</div>

								{/* 日期 */}
								<div>
									<label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">日期</label>
									<input
										type="date"
										value={currentData.date}
										onChange={(e) => setEditData({ ...currentData, date: e.target.value })}
										className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>

								{/* 操作按钮 */}
								<div className="flex gap-2 pt-2">
									<button
										onClick={() => handleSaveEdit(transaction.id)}
										disabled={!currentData.amount || !currentData.category}
										className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
									>
										<Check className="w-4 h-4" />
										保存
									</button>
									<button
										onClick={handleCancelEdit}
										className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
									>
										<X className="w-4 h-4" />
										取消
									</button>
								</div>
							</div>
						) : (
							// 显示模式
							<div className="flex items-center justify-between">
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
										{onUpdate && (
											<button
												onClick={() => handleStartEdit(transaction)}
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
						)}
					</div>
				);
			})}
		</div>
	);
}

