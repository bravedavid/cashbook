'use client';

import { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionsResponse, Category, CategoriesResponse } from '@/types';
import { calculateTotal, groupByCategory, groupByDate, formatCurrency } from '@/lib/utils';
import {
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#6b7280'];

// 格式化货币的辅助函数，处理 undefined 值
const formatCurrencyValue = (value: number | undefined): string => {
	if (value === undefined || value === null || isNaN(value)) {
		return formatCurrency(0);
	}
	return formatCurrency(value);
};

// 格式化饼图标签的辅助函数，处理 undefined 值
const formatPieLabel = (props: { name?: string; percent?: number }): string => {
	const nameValue = props.name ?? '';
	const percentValue = props.percent ?? 0;
	return `${nameValue} ${(percentValue * 100).toFixed(0)}%`;
};

type TimeRangeType = 'all' | 'month' | 'year' | 'custom';

export default function StatsPage() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [timeRange, setTimeRange] = useState<TimeRangeType>('all');
	const [customStartDate, setCustomStartDate] = useState<string>('');
	const [customEndDate, setCustomEndDate] = useState<string>('');
	const [allCategories, setAllCategories] = useState<Category[]>([]);

	useEffect(() => {
		loadTransactions();
		loadCategories();
	}, []);

	const loadCategories = async () => {
		try {
			const [incomeRes, expenseRes] = await Promise.all([
				fetch('/api/categories?type=income'),
				fetch('/api/categories?type=expense'),
			]);
			const incomeData = (await incomeRes.json()) as CategoriesResponse;
			const expenseData = (await expenseRes.json()) as CategoriesResponse;
			const categories = [
				...(incomeData.success ? incomeData.categories || [] : []),
				...(expenseData.success ? expenseData.categories || [] : []),
			];
			setAllCategories(categories);
		} catch (error) {
			console.error('Failed to load categories:', error);
		}
	};

	const loadTransactions = async () => {
		try {
			const response = await fetch('/api/transactions');
			const data: TransactionsResponse = await response.json();
			if (data.success) {
				setTransactions(data.transactions || []);
			}
		} catch (error) {
			console.error('Failed to load transactions:', error);
		}
	};

	const handleTimeRangeChange = (newRange: TimeRangeType) => {
		setTimeRange(newRange);
		// 如果切换到非自定义范围，清除自定义日期
		if (newRange !== 'custom') {
			setCustomStartDate('');
			setCustomEndDate('');
		}
	};

	const filteredTransactions = useMemo(() => {
		if (timeRange === 'all') return transactions;

		const now = new Date();
		let startDate: Date | null = null;
		let endDate: Date | null = null;

		if (timeRange === 'month') {
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
		} else if (timeRange === 'year') {
			startDate = new Date(now.getFullYear(), 0, 1);
		} else if (timeRange === 'custom') {
			if (customStartDate) {
				startDate = new Date(customStartDate);
			}
			if (customEndDate) {
				endDate = new Date(customEndDate);
				// 设置结束日期为当天的23:59:59
				endDate.setHours(23, 59, 59, 999);
			}
		}

		return transactions.filter((t) => {
			const transactionDate = new Date(t.date);
			if (startDate && transactionDate < startDate) return false;
			if (endDate && transactionDate > endDate) return false;
			return true;
		});
	}, [transactions, timeRange, customStartDate, customEndDate]);

	const income = calculateTotal(filteredTransactions, 'income');
	const expense = calculateTotal(filteredTransactions, 'expense');
	const balance = income - expense;

	const incomeByCategory = groupByCategory(filteredTransactions, 'income');
	const expenseByCategory = groupByCategory(filteredTransactions, 'expense');
	const dailyData = groupByDate(filteredTransactions);

	const getCategoryName = (id: string) => {
		const category = allCategories.find((c) => c.id === id);
		if (!category) {
			console.warn('Category not found:', id, 'Available categories:', allCategories.map(c => `${c.id}:${c.name}`));
			return id; // 如果找不到分类，返回ID
		}
		return category.name;
	};

	const incomeChartData = incomeByCategory.map((item) => ({
		name: getCategoryName(item.category),
		value: item.amount,
	}));

	const expenseChartData = expenseByCategory.map((item) => ({
		name: getCategoryName(item.category),
		value: item.amount,
	}));

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-7xl mx-auto px-4 py-8">
				{/* 头部 */}
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-4">
						<Link
							href="/"
							className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
						>
							<ArrowLeft className="w-6 h-6" />
						</Link>
						<div>
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">统计图表</h1>
							<p className="text-gray-500 dark:text-gray-400">可视化分析你的财务状况</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Link
							href="/settings"
							className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
							title="设置"
						>
							<Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
						</Link>
						<div className="flex gap-2 items-center">
							<button
								onClick={() => handleTimeRangeChange('all')}
								className={`px-4 py-2 rounded-lg transition-colors ${
									timeRange === 'all'
										? 'bg-blue-600 text-white'
										: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
								}`}
							>
								全部
							</button>
							<button
								onClick={() => handleTimeRangeChange('month')}
								className={`px-4 py-2 rounded-lg transition-colors ${
									timeRange === 'month'
										? 'bg-blue-600 text-white'
										: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
								}`}
							>
								本月
							</button>
							<button
								onClick={() => handleTimeRangeChange('year')}
								className={`px-4 py-2 rounded-lg transition-colors ${
									timeRange === 'year'
										? 'bg-blue-600 text-white'
										: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
								}`}
							>
								本年
							</button>
							<button
								onClick={() => handleTimeRangeChange('custom')}
								className={`px-4 py-2 rounded-lg transition-colors ${
									timeRange === 'custom'
										? 'bg-blue-600 text-white'
										: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
								}`}
							>
								自定义
							</button>

							{/* 自定义日期选择器 */}
							{timeRange === 'custom' && (
								<div className="flex gap-2 items-center ml-4">
									<div className="flex items-center gap-2">
										<label className="text-sm text-gray-600 dark:text-gray-400">开始:</label>
										<input
											type="date"
											value={customStartDate}
											onChange={(e) => setCustomStartDate(e.target.value)}
											className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										/>
									</div>
									<div className="flex items-center gap-2">
										<label className="text-sm text-gray-600 dark:text-gray-400">结束:</label>
										<input
											type="date"
											value={customEndDate}
											onChange={(e) => setCustomEndDate(e.target.value)}
											className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* 统计摘要 */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
						<div className="text-sm text-gray-600 dark:text-gray-400 mb-2">总收入</div>
						<div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(income)}</div>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
						<div className="text-sm text-gray-600 dark:text-gray-400 mb-2">总支出</div>
						<div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(expense)}</div>
					</div>
					<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
						<div className="text-sm text-gray-600 dark:text-gray-400 mb-2">余额</div>
						<div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
							{formatCurrency(balance)}
						</div>
					</div>
				</div>

				{/* 图表区域 */}
				<div className="space-y-8">
					{/* 每日收支趋势 */}
					{dailyData.length > 0 && (
						<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">每日收支趋势</h2>
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={dailyData}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
									<YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
									<Tooltip
										contentStyle={{
											backgroundColor: 'rgba(255, 255, 255, 0.95)',
											border: '1px solid #e5e7eb',
											borderRadius: '8px',
										}}
										formatter={formatCurrencyValue}
									/>
									<Legend />
									<Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="收入" />
									<Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="支出" />
								</LineChart>
							</ResponsiveContainer>
						</div>
					)}

					{/* 收入分类饼图 */}
					{incomeChartData.length > 0 && allCategories.length > 0 && (
						<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">收入分类分布</h2>
							<ResponsiveContainer width="100%" height={300}>
								<PieChart>
									<Pie
										data={incomeChartData}
										cx="50%"
										cy="50%"
										labelLine={false}
										label={formatPieLabel}
										outerRadius={100}
										fill="#8884d8"
										dataKey="value"
									>
										{incomeChartData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip formatter={formatCurrencyValue} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					)}

					{/* 支出分类饼图 */}
					{expenseChartData.length > 0 && allCategories.length > 0 && (
						<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">支出分类分布</h2>
							<ResponsiveContainer width="100%" height={300}>
								<PieChart>
									<Pie
										data={expenseChartData}
										cx="50%"
										cy="50%"
										labelLine={false}
										label={formatPieLabel}
										outerRadius={100}
										fill="#8884d8"
										dataKey="value"
									>
										{expenseChartData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip formatter={formatCurrencyValue} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					)}

					{/* 支出分类柱状图 */}
					{expenseChartData.length > 0 && allCategories.length > 0 && (
						<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">支出分类对比</h2>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={expenseChartData}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
									<YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
									<Tooltip
										contentStyle={{
											backgroundColor: 'rgba(255, 255, 255, 0.95)',
											border: '1px solid #e5e7eb',
											borderRadius: '8px',
										}}
										formatter={formatCurrencyValue}
									/>
									<Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					)}

					{/* 收入分类柱状图 */}
					{incomeChartData.length > 0 && allCategories.length > 0 && (
						<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">收入分类对比</h2>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={incomeChartData}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
									<YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
									<Tooltip
										contentStyle={{
											backgroundColor: 'rgba(255, 255, 255, 0.95)',
											border: '1px solid #e5e7eb',
											borderRadius: '8px',
										}}
										formatter={formatCurrencyValue}
									/>
									<Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

