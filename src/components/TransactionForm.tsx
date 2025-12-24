'use client';

import { useState, useEffect } from 'react';
import { TransactionFormData, Category, CategoriesResponse } from '@/types';
import { Plus, X } from 'lucide-react';

interface TransactionFormProps {
	onSubmit: (data: TransactionFormData) => void;
	onCancel?: () => void;
	initialData?: TransactionFormData;
	mode?: 'add' | 'edit';
}

export default function TransactionForm({ onSubmit, onCancel, initialData, mode = 'add' }: TransactionFormProps) {
	const [formData, setFormData] = useState<TransactionFormData>(
		initialData || {
			type: 'expense',
			amount: '',
			category: '',
			description: '',
			note: '',
			date: new Date().toISOString().split('T')[0],
		}
	);
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

	const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.amount || !formData.category) return;
		onSubmit(formData);
		setFormData({
			type: 'expense',
			amount: '',
			category: '',
			description: '',
			note: '',
			date: new Date().toISOString().split('T')[0],
		});
	};

	return (
		<form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{mode === 'edit' ? '编辑记录' : '新增记录'}</h2>
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
					>
						<X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
					</button>
				)}
			</div>

			<div className="space-y-6">
				{/* 类型选择 */}
				<div>
					<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">交易类型</label>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => {
								setFormData({ ...formData, type: 'income', category: '' });
							}}
							className={`flex-1 py-3 sm:py-4 px-4 rounded-xl font-semibold transition-all duration-200 ${
								formData.type === 'income'
									? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
							}`}
						>
							💰 收入
						</button>
						<button
							type="button"
							onClick={() => {
								setFormData({ ...formData, type: 'expense', category: '' });
							}}
							className={`flex-1 py-3 sm:py-4 px-4 rounded-xl font-semibold transition-all duration-200 ${
								formData.type === 'expense'
									? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg scale-105'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
							}`}
						>
							💸 支出
						</button>
					</div>
				</div>

				{/* 金额 */}
				<div>
					<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">金额</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={formData.amount}
						onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
						className="w-full px-4 py-3 sm:py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
						placeholder="0.00"
						required
					/>
				</div>

				{/* 分类 */}
				<div>
					<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">分类</label>
					<div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
						{categories.map((cat) => (
							<button
								key={cat.id}
								type="button"
								onClick={() => setFormData({ ...formData, category: cat.id })}
								className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
									formData.category === cat.id
										? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md scale-110'
										: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-gray-300'
								}`}
							>
								<div className="text-2xl sm:text-3xl">{cat.icon}</div>
								<div className="text-xs text-gray-700 dark:text-gray-300 text-center">{cat.name}</div>
							</button>
						))}
					</div>
				</div>

				{/* 描述 */}
				<div>
					<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">描述</label>
					<input
						type="text"
						value={formData.description}
						onChange={(e) => setFormData({ ...formData, description: e.target.value })}
						className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
						placeholder="添加一个描述（可选）"
					/>
				</div>

				{/* 备注 */}
				<div>
					<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">备注</label>
					<textarea
						value={formData.note || ''}
						onChange={(e) => setFormData({ ...formData, note: e.target.value })}
						className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
						placeholder="添加更多信息（可选）"
						rows={3}
					/>
				</div>

				{/* 日期 */}
				<div>
					<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">日期</label>
					<input
						type="date"
						value={formData.date}
						onChange={(e) => setFormData({ ...formData, date: e.target.value })}
						className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
						required
					/>
				</div>

				{/* 提交按钮 */}
				<button
					type="submit"
					className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg"
				>
					<Plus className="w-6 h-6" />
					{mode === 'edit' ? '保存修改' : '添加记录'}
				</button>
			</div>
		</form>
	);
}

