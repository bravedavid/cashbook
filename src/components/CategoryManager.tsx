'use client';

import { useState } from 'react';
import { Category, DeleteResponse } from '@/types';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';

interface CategoryManagerProps {
	categories: Category[];
	type: 'income' | 'expense';
	onAdd: (category: Omit<Category, 'id'> & { type: 'income' | 'expense' }) => Promise<void>;
	onDelete: (categoryId: string) => Promise<void>;
	onUpdate?: () => void; // 用于通知父组件刷新分类列表
}

const COMMON_ICONS = ['💰', '💵', '💳', '📊', '🎯', '⭐', '🔥', '💎', '🏆', '🎁', '🎉', '✨', '🌟', '💫', '⚡', '🎨'];
const COMMON_COLORS = [
	'#3b82f6', // blue
	'#10b981', // green
	'#f59e0b', // amber
	'#ef4444', // red
	'#8b5cf6', // purple
	'#ec4899', // pink
	'#6366f1', // indigo
	'#14b8a6', // teal
	'#f97316', // orange
	'#84cc16', // lime
];

export default function CategoryManager({ categories, type, onAdd, onDelete, onUpdate }: CategoryManagerProps) {
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [newCategory, setNewCategory] = useState({
		name: '',
		icon: '💰',
		color: COMMON_COLORS[0],
	});
	const [editCategory, setEditCategory] = useState({
		name: '',
		icon: '💰',
		color: '#3b82f6',
	});

	const systemCategories = categories.filter((c) => !c.id.startsWith('custom-'));
	const customCategories = categories.filter((c) => c.id.startsWith('custom-'));

	const handleAdd = async () => {
		if (!newCategory.name.trim()) {
			alert('请输入分类名称');
			return;
		}
		try {
			await onAdd({ ...newCategory, type });
			setNewCategory({ name: '', icon: '💰', color: COMMON_COLORS[0] });
			setShowAddForm(false);
			onUpdate?.(); // 通知父组件刷新
		} catch (error) {
			alert('添加失败：' + (error instanceof Error ? error.message : '未知错误'));
		}
	};

	const handleDelete = async (categoryId: string) => {
		if (!confirm('确定要删除这个分类吗？')) {
			return;
		}
		try {
			await onDelete(categoryId);
			onUpdate?.(); // 通知父组件刷新
		} catch (error) {
			alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
		}
	};

	const handleStartEdit = (category: Category) => {
		setEditingId(category.id);
		setEditCategory({ name: category.name, icon: category.icon, color: category.color });
	};

	const handleSaveEdit = async () => {
		if (!editCategory.name.trim()) {
			alert('请输入分类名称');
			return;
		}
		try {
			const response = await fetch(`/api/categories/${editingId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editCategory),
			});
			const data = (await response.json()) as DeleteResponse;
			if (data.success) {
				setEditingId(null);
				onUpdate?.(); // 通知父组件刷新
			} else {
				throw new Error(data.error || '更新失败');
			}
		} catch (error) {
			alert('更新失败：' + (error instanceof Error ? error.message : '未知错误'));
		}
	};

	return (
		<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-medium text-gray-900 dark:text-white">
					{type === 'income' ? '收入' : '支出'}分类
				</h3>
				{!showAddForm && (
					<button
						onClick={() => setShowAddForm(true)}
						className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
					>
						<Plus className="w-4 h-4" />
						添加分类
					</button>
				)}
			</div>

			{/* 添加分类表单 */}
			{showAddForm && (
				<div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">分类名称</label>
						<input
							type="text"
							value={newCategory.name}
							onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
							className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="例如：房租"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">图标</label>
						<div className="flex flex-wrap gap-2">
							{COMMON_ICONS.map((icon) => (
								<button
									key={icon}
									type="button"
									onClick={() => setNewCategory({ ...newCategory, icon })}
									className={`w-10 h-10 rounded-lg border-2 text-xl transition-all ${
										newCategory.icon === icon
											? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
											: 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
									}`}
								>
									{icon}
								</button>
							))}
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">颜色</label>
						<div className="flex flex-wrap gap-2">
							{COMMON_COLORS.map((color) => (
								<button
									key={color}
									type="button"
									onClick={() => setNewCategory({ ...newCategory, color })}
									className={`w-10 h-10 rounded-lg border-2 transition-all ${
										newCategory.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
									}`}
									style={{ backgroundColor: color }}
								/>
							))}
						</div>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleAdd}
							className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
						>
							<Check className="w-4 h-4" />
							添加
						</button>
						<button
							onClick={() => {
								setShowAddForm(false);
								setNewCategory({ name: '', icon: '💰', color: COMMON_COLORS[0] });
							}}
							className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
						>
							<X className="w-4 h-4" />
							取消
						</button>
					</div>
				</div>
			)}

			{/* 分类列表 */}
			<div className="space-y-2">
				{/* 系统分类 */}
				{systemCategories.length > 0 && (
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">系统分类（不可删除）</p>
						<div className="grid grid-cols-4 gap-2">
							{systemCategories.map((category) => (
								<div
									key={category.id}
									className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
								>
									<div className="text-2xl mb-1 text-center">{category.icon}</div>
									<div className="text-xs text-gray-700 dark:text-gray-300 text-center">{category.name}</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* 自定义分类 */}
				{customCategories.length > 0 && (
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-2">自定义分类</p>
						<div className="grid grid-cols-4 gap-2">
							{customCategories.map((category) => (
								<div
									key={category.id}
									className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 relative group"
								>
									{editingId === category.id ? (
										<div className="space-y-2">
											<input
												type="text"
												value={editCategory.name}
												onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
												className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
												placeholder="分类名称"
											/>
											<div>
												<label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">图标</label>
												<div className="flex flex-wrap gap-1">
													{COMMON_ICONS.slice(0, 8).map((icon) => (
														<button
															key={icon}
															type="button"
															onClick={() => setEditCategory({ ...editCategory, icon })}
															className={`w-7 h-7 rounded text-sm transition-all ${
																editCategory.icon === icon
																	? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
																	: 'border border-gray-200 dark:border-gray-600 hover:border-gray-300'
															}`}
														>
															{icon}
														</button>
													))}
												</div>
											</div>
											<div>
												<label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">颜色</label>
												<div className="flex flex-wrap gap-1">
													{COMMON_COLORS.slice(0, 6).map((color) => (
														<button
															key={color}
															type="button"
															onClick={() => setEditCategory({ ...editCategory, color })}
															className={`w-7 h-7 rounded border-2 transition-all ${
																editCategory.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
															}`}
															style={{ backgroundColor: color }}
														/>
													))}
												</div>
											</div>
											<div className="flex gap-1">
												<button
													onClick={handleSaveEdit}
													className="flex-1 p-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
												>
													✓
												</button>
												<button
													onClick={() => {
														setEditingId(null);
														setEditCategory({ name: '', icon: '💰', color: '#3b82f6' });
													}}
													className="flex-1 p-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
												>
													✕
												</button>
											</div>
										</div>
									) : (
										<>
											<div className="text-2xl mb-1 text-center">{category.icon}</div>
											<div className="text-xs text-gray-700 dark:text-gray-300 text-center">{category.name}</div>
											<div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
												<button
													onClick={() => handleStartEdit(category)}
													className="p-1 bg-blue-500 text-white rounded text-xs"
													title="编辑"
												>
													<Edit2 className="w-3 h-3" />
												</button>
												<button
													onClick={() => handleDelete(category.id)}
													className="p-1 bg-red-500 text-white rounded text-xs"
													title="删除"
												>
													<Trash2 className="w-3 h-3" />
												</button>
											</div>
										</>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{categories.length === 0 && (
					<p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">暂无分类</p>
				)}
			</div>
		</div>
	);
}

