'use client';

import { useState, useEffect } from 'react';
import { settings, AppSettings, AVAILABLE_MODELS } from '@/lib/settings';
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import CategoryManager from '@/components/CategoryManager';
import { Category, CategoriesResponse, CategoryResponse, DeleteResponse } from '@/types';

export default function SettingsPage() {
	const [formData, setFormData] = useState<AppSettings>({
		openRouterApiKey: '',
		model: 'openai/gpt-4o',
	});
	const [showApiKey, setShowApiKey] = useState(false);
	const [saved, setSaved] = useState(false);
	const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
	const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);

	useEffect(() => {
		const currentSettings = settings.getSettings();
		setFormData(currentSettings);
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
			if (incomeData.success) setIncomeCategories(incomeData.categories || []);
			if (expenseData.success) setExpenseCategories(expenseData.categories || []);
		} catch (error) {
			console.error('Failed to load categories:', error);
		}
	};

	const handleAddCategory = async (category: Omit<Category, 'id'> & { type: 'income' | 'expense' }) => {
		const response = await fetch('/api/categories', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(category),
		});
		const data = (await response.json()) as CategoryResponse;
		if (data.success) {
			await loadCategories();
		} else {
			throw new Error(data.error || '添加失败');
		}
	};

	const handleDeleteCategory = async (categoryId: string) => {
		const response = await fetch(`/api/categories/${categoryId}`, {
			method: 'DELETE',
		});
		const data = (await response.json()) as DeleteResponse;
		if (data.success) {
			await loadCategories();
		} else {
			throw new Error(data.error || '删除失败');
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		settings.saveSettings(formData);
		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	};

	const handleReset = () => {
		if (confirm('确定要重置所有设置吗？')) {
			settings.resetSettings();
			const defaultSettings = settings.getSettings();
			setFormData(defaultSettings);
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
							<h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">设置</h1>
							<p className="text-gray-600 dark:text-gray-400 text-base">配置 OpenRouter API 和模型选择</p>
						</div>
					</div>
				</div>

				{/* 设置表单 */}
				<form onSubmit={handleSubmit} className="space-y-8">
					{/* OpenRouter API Key */}
					<div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
						<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">AI 模型配置</h2>
						<label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
							OpenRouter API Key
						</label>
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
							获取 API Key：访问{' '}
							<a
								href="https://openrouter.ai/keys"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
							>
								https://openrouter.ai/keys
							</a>
						</p>
						<div className="relative mb-3">
							<input
								type={showApiKey ? 'text' : 'password'}
								value={formData.openRouterApiKey}
								onChange={(e) => setFormData({ ...formData, openRouterApiKey: e.target.value })}
								className="w-full px-5 py-3.5 pr-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
								placeholder="sk-or-v1-..."
							/>
							<button
								type="button"
								onClick={() => setShowApiKey(!showApiKey)}
								className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
							>
								{showApiKey ? (
									<EyeOff className="w-5 h-5 text-gray-500 dark:text-gray-400" />
								) : (
									<Eye className="w-5 h-5 text-gray-500 dark:text-gray-400" />
								)}
							</button>
						</div>
						{formData.openRouterApiKey && (
							<p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
								<CheckCircle2 className="w-4 h-4" />
								已配置 API Key（{formData.openRouterApiKey.substring(0, 10)}...）
							</p>
						)}
					</div>

					{/* 模型选择 */}
					<div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
						<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">选择 AI 模型</h2>
						<p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
							选择用于识别银行流水的 AI 模型。不同模型的准确度和成本不同。
						</p>
						<div className="space-y-3">
							{AVAILABLE_MODELS.map((model) => (
								<label
									key={model.id}
									className={`flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
										formData.model === model.id
											? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 shadow-md'
											: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
									}`}
								>
									<input
										type="radio"
										name="model"
										value={model.id}
										checked={formData.model === model.id}
										onChange={(e) => setFormData({ ...formData, model: e.target.value })}
										className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
									/>
									<div className="flex-1">
										<div className="font-semibold text-gray-900 dark:text-white text-base">{model.name}</div>
										<div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{model.description}</div>
										<div className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg inline-block">{model.id}</div>
									</div>
								</label>
							))}
						</div>
					</div>

					{/* 操作按钮 */}
					<div className="flex flex-col sm:flex-row gap-4">
						<button
							type="submit"
							className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg sm:text-base"
						>
							<Save className="w-6 h-6" />
							保存设置
						</button>
						<button
							type="button"
							onClick={handleReset}
							className="px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200 active:scale-95"
						>
							重置
						</button>
					</div>

					{/* 保存成功提示 */}
					{saved && (
						<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2 text-green-800 dark:text-green-200">
							<CheckCircle2 className="w-5 h-5" />
							<span>设置已保存</span>
						</div>
					)}
				</form>

				{/* 分类管理 */}
				<div className="mt-8 space-y-6">
					<CategoryManager
						categories={incomeCategories}
						type="income"
						onAdd={handleAddCategory}
						onDelete={handleDeleteCategory}
						onUpdate={loadCategories}
					/>
					<CategoryManager
						categories={expenseCategories}
						type="expense"
						onAdd={handleAddCategory}
						onDelete={handleDeleteCategory}
						onUpdate={loadCategories}
					/>
				</div>

				{/* 使用说明 */}
				<div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
					<h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">使用说明</h3>
					<ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
						<li>
							<strong>1. 获取 API Key：</strong>访问 OpenRouter 网站注册账号并获取 API Key
						</li>
						<li>
							<strong>2. 选择模型：</strong>
							<ul className="ml-4 mt-1 space-y-1">
								<li>• GPT-4o：准确度最高，适合重要场景</li>
								<li>• GPT-4o Mini：速度快，成本低，适合日常使用</li>
								<li>• Claude 3.5 Sonnet：平衡性能和成本</li>
								<li>• Gemini 3 Flash Preview：最新的高速模型，速度与成本优化</li>
							</ul>
						</li>
						<li>
							<strong>3. 保存设置：</strong>设置会自动保存到本地，下次使用时无需重新配置
						</li>
						<li>
							<strong>4. 隐私安全：</strong>所有设置仅存储在本地浏览器中，不会上传到服务器
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

