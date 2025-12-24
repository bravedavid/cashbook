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
import { ArrowLeft, Settings, PieChart as PieChartIcon, BarChart3, Table } from 'lucide-react';
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

type ChartViewType = 'pie' | 'bar' | 'table';

export default function StatsPage() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [timeRange, setTimeRange] = useState<'all' | 'month' | 'year'>('all');
	const [allCategories, setAllCategories] = useState<Category[]>([]);
	const [incomeView, setIncomeView] = useState<ChartViewType>('bar');
	const [expenseView, setExpenseView] = useState<ChartViewType>('bar');

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

	const filteredTransactions = useMemo(() => {
		if (timeRange === 'all') return transactions;
		const now = new Date();
		if (timeRange === 'month') {
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
			return transactions.filter((t) => new Date(t.date) >= startOfMonth);
		}
		if (timeRange === 'year') {
			const startOfYear = new Date(now.getFullYear(), 0, 1);
			return transactions.filter((t) => new Date(t.date) >= startOfYear);
		}
		return transactions;
	}, [transactions, timeRange]);

	const income = calculateTotal(filteredTransactions, 'income');
	const expense = calculateTotal(filteredTransactions, 'expense');
	const balance = income - expense;

	const incomeByCategory = groupByCategory(filteredTransactions, 'income');
	const expenseByCategory = groupByCategory(filteredTransactions, 'expense');
	const dailyData = groupByDate(filteredTransactions);

	const getCategoryName = (id: string) => {
		if (!id) {
			return '未知分类';
		}

		// 首先尝试精确匹配
		const category = allCategories.find((c) => c.id === id);
		if (category) {
			return category.name;
		}

		// 如果找不到，可能是ID格式有问题（包含了名称）
		// 自定义分类ID格式：custom-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（UUID格式）
		// 如果ID后面有额外的内容（名称），需要提取纯ID部分
		
		// 处理格式：custom-xxx-名称 或 custom-xxx:名称
		// UUID格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（5段，用-分隔）
		// 自定义分类ID：custom-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（6段，用-分隔）
		// 如果后面还有内容，那就是名称部分
		
		// 尝试匹配 custom-xxx-名称 格式
		// UUID有5段，加上custom前缀，总共6段，如果超过6段，多出来的就是名称
		const parts = id.split('-');
		if (parts.length > 6 && parts[0] === 'custom') {
			// 提取前6段作为纯ID（custom + UUID的5段）
			const pureId = parts.slice(0, 6).join('-');
			const categoryByPureId = allCategories.find((c) => c.id === pureId);
			if (categoryByPureId) {
				return categoryByPureId.name;
			}
			// 如果还是找不到，返回提取的名称部分（第7段及之后）
			const namePart = parts.slice(6).join('-');
			if (/[\u4e00-\u9fa5]/.test(namePart)) {
				return namePart;
			}
		}

		// 尝试匹配 custom-xxx:名称 格式（使用 : 分隔）
		// UUID格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（5段）
		// 自定义分类ID：custom-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx（6段）
		const colonMatch = id.match(/^(custom-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}):(.+)$/);
		if (colonMatch) {
			const pureId = colonMatch[1];
			const categoryByPureId = allCategories.find((c) => c.id === pureId);
			if (categoryByPureId) {
				return categoryByPureId.name;
			}
			// 如果还是找不到，返回提取的名称部分
			return colonMatch[2];
		}

		// 尝试部分匹配（ID包含关系）
		// 检查交易记录的ID是否以某个分类ID开头（后面跟着 - 或 :）
		// 这是最通用的匹配方式，可以处理各种格式问题
		const prefixMatch = allCategories.find((c) => {
			// 检查ID是否以分类ID开头，并且后面跟着分隔符（- 或 :）
			return (id.startsWith(c.id + '-') && id.length > c.id.length + 1) || 
			       (id.startsWith(c.id + ':') && id.length > c.id.length + 1);
		});
		if (prefixMatch) {
			return prefixMatch.name;
		}

		// 如果都找不到，尝试从ID中提取名称部分
		// 假设名称是最后一个分隔符后的内容（且包含中文）
		if (parts.length > 1) {
			const possibleName = parts[parts.length - 1];
			// 如果最后一部分看起来像中文（不是UUID的一部分），返回它
			if (/[\u4e00-\u9fa5]/.test(possibleName)) {
				return possibleName;
			}
		}

		// 最后降级：返回ID本身
		console.warn('Category not found:', id, 'Available categories:', allCategories.map(c => `${c.id}:${c.name}`));
		return id;
	};

	// 数据聚合函数：将小分类合并为"其他"
	const aggregateSmallCategories = (data: Array<{ name: string; value: number }>, thresholdPercent: number = 3) => {
		const total = data.reduce((sum, item) => sum + item.value, 0);
		const threshold = total * (thresholdPercent / 100);
		
		const mainCategories: Array<{ name: string; value: number }> = [];
		let otherTotal = 0;
		const otherCategories: string[] = [];
		
		data.forEach((item) => {
			if (item.value >= threshold) {
				mainCategories.push(item);
			} else {
				otherTotal += item.value;
				otherCategories.push(item.name);
			}
		});
		
		// 按金额降序排序
		mainCategories.sort((a, b) => b.value - a.value);
		
		// 如果有小分类，添加"其他"项
		if (otherTotal > 0) {
			mainCategories.push({
				name: `其他 (${otherCategories.length}项)`,
				value: otherTotal,
			});
		}
		
		return mainCategories;
	};

	const incomeChartDataRaw = incomeByCategory.map((item) => ({
		name: getCategoryName(item.category),
		value: item.amount,
	}));

	const expenseChartDataRaw = expenseByCategory.map((item) => ({
		name: getCategoryName(item.category),
		value: item.amount,
	}));

	// 聚合后的图表数据（用于饼图和柱状图）
	const incomeChartData = aggregateSmallCategories(incomeChartDataRaw, 3);
	const expenseChartData = aggregateSmallCategories(expenseChartDataRaw, 3);

	// 原始数据（用于表格视图）
	const incomeTableData = incomeChartDataRaw.sort((a, b) => b.value - a.value);
	const expenseTableData = expenseChartDataRaw.sort((a, b) => b.value - a.value);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				{/* 头部 */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
					<div className="flex items-start gap-4">
						<Link
							href="/"
							className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full transition-colors duration-200 mt-0.5"
						>
							<ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
						</Link>
						<div>
							<h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">统计图表</h1>
							<p className="text-gray-600 dark:text-gray-400 text-base">可视化分析你的财务状况</p>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
						<Link
							href="/settings"
							className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full transition-colors duration-200"
							title="设置"
						>
							<Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
						</Link>
						<div className="flex gap-2 bg-gray-100 dark:bg-gray-700/30 rounded-full p-1.5 border border-gray-200 dark:border-gray-600/30">
							<button
								onClick={() => setTimeRange('all')}
								className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
									timeRange === 'all'
										? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
										: 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
								}`}
							>
								全部
							</button>
							<button
								onClick={() => setTimeRange('month')}
								className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
									timeRange === 'month'
										? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
										: 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
								}`}
							>
								本月
							</button>
							<button
								onClick={() => setTimeRange('year')}
								className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
									timeRange === 'year'
										? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
										: 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
								}`}
							>
								本年
							</button>
						</div>
					</div>
				</div>

				{/* 统计摘要 */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
					<div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 sm:p-8 shadow-lg border border-green-200 dark:border-green-800/40 transition-all duration-200 hover:shadow-xl hover:scale-105">
						<div className="text-sm sm:text-base font-semibold text-green-700 dark:text-green-400 mb-2">总收入</div>
						<div className="text-3xl sm:text-4xl font-bold text-green-700 dark:text-green-400">{formatCurrency(income)}</div>
					</div>
					<div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 sm:p-8 shadow-lg border border-red-200 dark:border-red-800/40 transition-all duration-200 hover:shadow-xl hover:scale-105">
						<div className="text-sm sm:text-base font-semibold text-red-700 dark:text-red-400 mb-2">总支出</div>
						<div className="text-3xl sm:text-4xl font-bold text-red-700 dark:text-red-400">{formatCurrency(expense)}</div>
					</div>
					<div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20' : 'from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20'} rounded-2xl p-6 sm:p-8 shadow-lg ${balance >= 0 ? 'border-blue-200 dark:border-blue-800/40' : 'border-orange-200 dark:border-orange-800/40'} border transition-all duration-200 hover:shadow-xl hover:scale-105`}>
						<div className={`text-sm sm:text-base font-semibold ${balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'} mb-2`}>余额</div>
						<div className={`text-3xl sm:text-4xl font-bold ${balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
							{formatCurrency(balance)}
						</div>
					</div>
				</div>

				{/* 图表区域 */}
				<div className="space-y-8 mt-10">
					{/* 每日收支趋势 */}
					{dailyData.length > 0 && (
						<div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
							<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">每日收支趋势</h2>
							<ResponsiveContainer width="100%" height={350}>
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

					{/* 收入分类图表 */}
					{incomeChartData.length > 0 && allCategories.length > 0 && (
						<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-bold text-gray-900 dark:text-white">收入分类分布</h2>
								<div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
									<button
										onClick={() => setIncomeView('pie')}
										className={`p-2 rounded transition-colors ${
											incomeView === 'pie'
												? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
												: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
										}`}
										title="饼图"
									>
										<PieChartIcon className="w-4 h-4" />
									</button>
									<button
										onClick={() => setIncomeView('bar')}
										className={`p-2 rounded transition-colors ${
											incomeView === 'bar'
												? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
												: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
										}`}
										title="柱状图"
									>
										<BarChart3 className="w-4 h-4" />
									</button>
									<button
										onClick={() => setIncomeView('table')}
										className={`p-2 rounded transition-colors ${
											incomeView === 'table'
												? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
												: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
										}`}
										title="表格"
									>
										<Table className="w-4 h-4" />
									</button>
								</div>
							</div>
							{incomeView === 'pie' && (
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
							)}
							{incomeView === 'bar' && (
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={incomeChartData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
										<XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} angle={-45} textAnchor="end" height={100} />
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
							)}
							{incomeView === 'table' && (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-gray-200 dark:border-gray-700">
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">分类</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">金额</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">占比</th>
											</tr>
										</thead>
										<tbody>
											{incomeTableData.map((item, index) => {
												const percent = income > 0 ? ((item.value / income) * 100).toFixed(1) : '0.0';
												return (
													<tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
														<td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{item.name}</td>
														<td className="py-3 px-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
															{formatCurrency(item.value)}
														</td>
														<td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">{percent}%</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

					{/* 支出分类图表 */}
					{expenseChartData.length > 0 && allCategories.length > 0 && (
						<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-xl font-bold text-gray-900 dark:text-white">支出分类分布</h2>
								<div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
									<button
										onClick={() => setExpenseView('pie')}
										className={`p-2 rounded transition-colors ${
											expenseView === 'pie'
												? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
												: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
										}`}
										title="饼图"
									>
										<PieChartIcon className="w-4 h-4" />
									</button>
									<button
										onClick={() => setExpenseView('bar')}
										className={`p-2 rounded transition-colors ${
											expenseView === 'bar'
												? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
												: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
										}`}
										title="柱状图"
									>
										<BarChart3 className="w-4 h-4" />
									</button>
									<button
										onClick={() => setExpenseView('table')}
										className={`p-2 rounded transition-colors ${
											expenseView === 'table'
												? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
												: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
										}`}
										title="表格"
									>
										<Table className="w-4 h-4" />
									</button>
								</div>
							</div>
							{expenseView === 'pie' && (
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
							)}
							{expenseView === 'bar' && (
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={expenseChartData}>
										<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
										<XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} angle={-45} textAnchor="end" height={100} />
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
							)}
							{expenseView === 'table' && (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-gray-200 dark:border-gray-700">
												<th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">分类</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">金额</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">占比</th>
											</tr>
										</thead>
										<tbody>
											{expenseTableData.map((item, index) => {
												const percent = expense > 0 ? ((item.value / expense) * 100).toFixed(1) : '0.0';
												return (
													<tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
														<td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{item.name}</td>
														<td className="py-3 px-4 text-sm text-right font-medium text-red-600 dark:text-red-400">
															{formatCurrency(item.value)}
														</td>
														<td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">{percent}%</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							)}
						</div>
					)}

				</div>
			</div>
		</div>
	);
}

