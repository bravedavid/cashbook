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
		<div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm mb-8 overflow-hidden transition-all duration-200">
			<div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700/50">
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="w-full flex items-center justify-between text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
				>
					<div className="flex items-center gap-3">
						<Filter className="w-5 h-5 sm:w-6 sm:h-6" />
						<span className="font-semibold text-base sm:text-lg">筛选条件</span>
						{hasActiveFilters && (
							<span className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-700/50">
								已激活
							</span>
						)}
					</div>
					<div className="text-gray-600 dark:text-gray-400 transition-transform duration-300" style={{transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'}}>
						🔽
					</div>
				</button>
			</div>

			{isExpanded && (
				<div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
						{/* 类型筛选 */}
						<div>
							<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">交易类型</label>
							<select
								value={filters.type}
								onChange={(e) => handleFilterChange('type', e.target.value)}
								className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
							>
								<option value="all">全部</option>
								<option value="income">收入</option>
								<option value="expense">支出</option>
							</select>
						</div>

						{/* 分类筛选 */}
						<div>
							<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">分类</label>
							<select
								value={filters.category}
								onChange={(e) => handleFilterChange('category', e.target.value)}
								className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
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
							<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">最小金额</label>
							<input
								type="number"
								step="0.01"
								min="0"
								value={filters.minAmount}
								onChange={(e) => handleFilterChange('minAmount', e.target.value)}
								className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
								placeholder="0.00"
							/>
						</div>

						{/* 最大金额 */}
						<div>
							<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">最大金额</label>
							<input
								type="number"
								step="0.01"
								min="0"
								value={filters.maxAmount}
								onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
								className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
								placeholder="不限"
							/>
						</div>

						{/* 开始日期 */}
						<div>
							<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">开始日期</label>
							<input
								type="date"
								value={filters.startDate}
								onChange={(e) => handleFilterChange('startDate', e.target.value)}
								className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
							/>
						</div>

						{/* 结束日期 */}
						<div>
							<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">结束日期</label>
							<input
								type="date"
								value={filters.endDate}
								onChange={(e) => handleFilterChange('endDate', e.target.value)}
								className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
							/>
						</div>
					</div>

					{hasActiveFilters && (
						<div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
							<button
								onClick={handleReset}
								className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
							>
								<X className="w-5 h-5" />
								<span className="hidden sm:inline">清除筛选</span>
								<span className="sm:hidden">清除</span>
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

