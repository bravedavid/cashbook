'use client';

import { useState } from 'react';
import { TransactionFormData, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import { Plus, X } from 'lucide-react';

interface TransactionFormProps {
	onSubmit: (data: TransactionFormData) => void;
	onCancel?: () => void;
}

export default function TransactionForm({ onSubmit, onCancel }: TransactionFormProps) {
	const [formData, setFormData] = useState<TransactionFormData>({
		type: 'expense',
		amount: '',
		category: '',
		description: '',
		date: new Date().toISOString().split('T')[0],
	});

	const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.amount || !formData.category) return;
		onSubmit(formData);
		setFormData({
			type: 'expense',
			amount: '',
			category: '',
			description: '',
			date: new Date().toISOString().split('T')[0],
		});
	};

	return (
		<form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-xl font-bold text-gray-900 dark:text-white">添加记录</h2>
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				)}
			</div>

			<div className="space-y-4">
				{/* 类型选择 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">类型</label>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => {
								setFormData({ ...formData, type: 'income', category: '' });
							}}
							className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
								formData.type === 'income'
									? 'bg-green-500 text-white shadow-md'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
							}`}
						>
							收入
						</button>
						<button
							type="button"
							onClick={() => {
								setFormData({ ...formData, type: 'expense', category: '' });
							}}
							className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
								formData.type === 'expense'
									? 'bg-red-500 text-white shadow-md'
									: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
							}`}
						>
							支出
						</button>
					</div>
				</div>

				{/* 金额 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">金额</label>
					<input
						type="number"
						step="0.01"
						min="0"
						value={formData.amount}
						onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
						className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="0.00"
						required
					/>
				</div>

				{/* 分类 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类</label>
					<div className="grid grid-cols-4 gap-2">
						{categories.map((cat) => (
							<button
								key={cat.id}
								type="button"
								onClick={() => setFormData({ ...formData, category: cat.id })}
								className={`p-3 rounded-lg border-2 transition-all ${
									formData.category === cat.id
										? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
										: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-gray-300'
								}`}
							>
								<div className="text-2xl mb-1">{cat.icon}</div>
								<div className="text-xs text-gray-700 dark:text-gray-300">{cat.name}</div>
							</button>
						))}
					</div>
				</div>

				{/* 描述 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">描述</label>
					<input
						type="text"
						value={formData.description}
						onChange={(e) => setFormData({ ...formData, description: e.target.value })}
						className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="备注信息（可选）"
					/>
				</div>

				{/* 日期 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">日期</label>
					<input
						type="date"
						value={formData.date}
						onChange={(e) => setFormData({ ...formData, date: e.target.value })}
						className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						required
					/>
				</div>

				{/* 提交按钮 */}
				<button
					type="submit"
					className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
				>
					<Plus className="w-5 h-5" />
					添加记录
				</button>
			</div>
		</form>
	);
}

