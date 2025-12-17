'use client';

import { useState, useEffect } from 'react';
import { TransactionType, Category, CategoriesResponse } from '@/types';
import { Filter, X } from 'lucide-react';

export interface FilterOptions {
	type: TransactionType | 'all';
	category: string;
	minAmount: string;
	maxAmount: string;
	startDate: string;
	endDate: string;
}

interface TransactionFilterProps {
	onFilterChange: (filters: FilterOptions) => void;
	onReset: () => void;
}

export default function TransactionFilter({ onFilterChange, onReset }: TransactionFilterProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [filters, setFilters] = useState<FilterOptions>({
		type: 'all',
		category: '',
		minAmount: '',
		maxAmount: '',
		startDate: '',
		endDate: '',
	});
	const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
	const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);

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

	const hasActiveFilters = filters.type !== 'all' || filters.category !== '' || filters.minAmount !== '' || filters.maxAmount !== '' || filters.startDate !== '' || filters.endDate !== '';

	const handleFilterChange = (key: keyof FilterOptions, value: string) => {
		const newFilters = { ...filters, [key]: value };
		setFilters(newFilters);
		onFilterChange(newFilters);
	};

	const handleReset = () => {
		const resetFilters: FilterOptions = {
			type: 'all',
			category: '',
			minAmount: '',
			maxAmount: '',
			startDate: '',
			endDate: '',
		};
		setFilters(resetFilters);
		onReset();
	};

	return (
		<div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
			<div className="flex items-center justify-between mb-4">
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
				>
					<Filter className="w-5 h-5" />
					<span className="font-medium">筛选条件</span>
					{hasActiveFilters && (
						<span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
							已启用
						</span>
					)}
				</button>
				{hasActiveFilters && (
					<button
						onClick={handleReset}
						className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						<X className="w-4 h-4" />
						清除
					</button>
				)}
			</div>

			{isExpanded && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* 类型筛选 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">类型</label>
						<select
							value={filters.type}
							onChange={(e) => handleFilterChange('type', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="all">全部</option>
							<option value="income">收入</option>
							<option value="expense">支出</option>
						</select>
					</div>

					{/* 分类筛选 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类</label>
						<select
							value={filters.category}
							onChange={(e) => handleFilterChange('category', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="">全部</option>
							{(filters.type === 'all' || filters.type === 'income' ? incomeCategories : []).map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.icon} {cat.name}
								</option>
							))}
							{(filters.type === 'all' || filters.type === 'expense' ? expenseCategories : []).map((cat) => (
								<option key={cat.id} value={cat.id}>
									{cat.icon} {cat.name}
								</option>
							))}
						</select>
					</div>

					{/* 最小金额 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">最小金额</label>
						<input
							type="number"
							step="0.01"
							min="0"
							value={filters.minAmount}
							onChange={(e) => handleFilterChange('minAmount', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="0.00"
						/>
					</div>

					{/* 最大金额 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">最大金额</label>
						<input
							type="number"
							step="0.01"
							min="0"
							value={filters.maxAmount}
							onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="不限"
						/>
					</div>

					{/* 开始日期 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">开始日期</label>
						<input
							type="date"
							value={filters.startDate}
							onChange={(e) => handleFilterChange('startDate', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					{/* 结束日期 */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">结束日期</label>
						<input
							type="date"
							value={filters.endDate}
							onChange={(e) => handleFilterChange('endDate', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>
			)}
		</div>
	);
}

