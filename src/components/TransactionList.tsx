'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionFormData, Category, CategoriesResponse } from '@/types';
import { formatCurrency, formatDate, groupTransactionsByMonth, MonthlyGroup, DailyGroup } from '@/lib/utils';
import { Trash2, Edit2, Check, X, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface TransactionListProps {
	transactions: Transaction[];
	onDelete: (id: string) => void;
	onUpdate?: (id: string, data: TransactionFormData) => void;
	viewMode?: 'list' | 'monthly';
}

export default function TransactionList({ transactions, onDelete, onUpdate, viewMode = 'list' }: TransactionListProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editData, setEditData] = useState<TransactionFormData | null>(null);
	const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
	const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
	const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

	useEffect(() => {
		const loadCategories = async () => {
			try {
				const [incomeRes, expenseRes] = await Promise.all([
					fetch('/api/categories?type=income'),
					fetch('/api/categories?type=expense'),
				]);
			const incomeData = (await incomeRes.json()) as CategoriesResponse;
			const expenseData = (await expenseRes.json()) as CategoriesResponse;
			if (incomeData.success) setIncomeCategories(incomeData.categories || []);
			if (expenseData.success) setExpenseCategories(expenseData.categories || []);
			} catch (error) {
				console.error('Failed to load categories:', error);
			}
		};
		loadCategories();
	}, []);

	const allCategories = [...incomeCategories, ...expenseCategories];
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

	const toggleMonthExpanded = (monthKey: string) => {
		setExpandedMonths(prev => {
			const newSet = new Set(prev);
			if (newSet.has(monthKey)) {
				newSet.delete(monthKey);
			} else {
				newSet.add(monthKey);
			}
			return newSet;
		});
	};

	if (transactions.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500 dark:text-gray-400">
				<p>暂无记录</p>
			</div>
		);
	}

	// 按月聚合的交易记录
	const monthlyGroups = groupTransactionsByMonth(transactions);

	// 渲染单个交易记录项
	const renderTransactionItem = (transaction: Transaction) => {
		const category = getCategory(transaction.category);
		const isIncome = transaction.type === 'income';
		const isEditing = editingId === transaction.id;
		const currentData = isEditing && editData ? editData : null;
		const categories = currentData?.type === 'income' ? incomeCategories : expenseCategories;

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
	};

	// 渲染日分组
	const renderDailyGroup = (dailyGroup: DailyGroup) => {
		return (
			<div key={dailyGroup.date} className="mb-4">
				{/* 日期标题和当日统计 */}
				<div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 mb-3 border border-gray-200 dark:border-gray-600">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
								<Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<h4 className="text-lg font-bold text-gray-900 dark:text-white">{dailyGroup.dateDisplay}</h4>
								<p className="text-sm text-gray-500 dark:text-gray-400">{dailyGroup.count}笔记录</p>
							</div>
						</div>
						<div className="flex items-center gap-4">
							{dailyGroup.income > 0 && (
								<div className="text-right">
									<span className="text-green-600 dark:text-green-400 font-semibold">
										+{formatCurrency(dailyGroup.income)}
									</span>
									<p className="text-xs text-gray-500 dark:text-gray-400">收入</p>
								</div>
							)}
							{dailyGroup.expense > 0 && (
								<div className="text-right">
									<span className="text-red-600 dark:text-red-400 font-semibold">
										-{formatCurrency(dailyGroup.expense)}
									</span>
									<p className="text-xs text-gray-500 dark:text-gray-400">支出</p>
								</div>
							)}
							{dailyGroup.balance !== 0 && (
								<div className="text-right border-l border-gray-200 dark:border-gray-600 pl-4">
									<span className={`font-bold ${dailyGroup.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
										{dailyGroup.balance >= 0 ? '+' : ''}{formatCurrency(dailyGroup.balance)}
									</span>
									<p className="text-xs text-gray-500 dark:text-gray-400">净收支</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* 当日交易记录列表 */}
				<div className="space-y-2 ml-4">
					{dailyGroup.transactions.map(renderTransactionItem)}
				</div>
			</div>
		);
	};

	// 渲染月分组
	const renderMonthlyGroup = (group: MonthlyGroup) => {
		const isExpanded = expandedMonths.has(group.monthKey);

		return (
			<div key={group.monthKey} className="mb-8">
				{/* 月标题和统计信息 */}
				<div
					className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5 mb-4 cursor-pointer hover:shadow-lg transition-all duration-200 border border-blue-200 dark:border-gray-500"
					onClick={() => toggleMonthExpanded(group.monthKey)}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
								{isExpanded ? (
									<ChevronDown className="w-5 h-5 text-white" />
								) : (
									<ChevronRight className="w-5 h-5 text-white" />
								)}
							</div>
							<div>
								<h3 className="text-xl font-bold text-gray-900 dark:text-white">{group.monthName}</h3>
								<p className="text-sm text-gray-600 dark:text-gray-300">{group.count}笔记录</p>
							</div>
						</div>
						<div className="flex items-center gap-6">
							<div className="text-center">
								<div className="flex items-center gap-2">
									<TrendingUp className="w-5 h-5 text-green-600" />
									<span className="text-green-600 dark:text-green-400 font-bold text-lg">
										+{formatCurrency(group.income)}
									</span>
								</div>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">收入</p>
							</div>
							<div className="text-center">
								<div className="flex items-center gap-2">
									<TrendingDown className="w-5 h-5 text-red-600" />
									<span className="text-red-600 dark:text-red-400 font-bold text-lg">
										-{formatCurrency(group.expense)}
									</span>
								</div>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">支出</p>
							</div>
							<div className="text-center border-l border-gray-200 dark:border-gray-600 pl-6">
								<span className={`font-bold text-lg ${group.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
									{group.balance >= 0 ? '+' : ''}{formatCurrency(group.balance)}
								</span>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">余额</p>
							</div>
						</div>
					</div>
				</div>

				{/* 展开的按天分组交易记录列表 */}
				{isExpanded && (
					<div className="space-y-3 ml-6">
						{group.dailyGroups.map(renderDailyGroup)}
					</div>
				)}
			</div>
		);
	};

	if (viewMode === 'monthly') {
		return (
			<div className="space-y-4">
				{monthlyGroups.map(renderMonthlyGroup)}
			</div>
		);
	}

	// 默认列表视图
	return (
		<div className="space-y-2">
			{transactions.map(renderTransactionItem)}
		</div>
	);
}

