'use client';

import { useState, useEffect } from 'react';
import { settings, AppSettings, AVAILABLE_MODELS } from '@/lib/settings';
import { ArrowLeft, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
	const [formData, setFormData] = useState<AppSettings>({
		openRouterApiKey: '',
		model: 'openai/gpt-4o',
	});
	const [showApiKey, setShowApiKey] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		const currentSettings = settings.getSettings();
		setFormData(currentSettings);
	}, []);

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
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-2xl mx-auto px-4 py-8">
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
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">设置</h1>
							<p className="text-gray-500 dark:text-gray-400">配置 OpenRouter API 和模型选择</p>
						</div>
					</div>
				</div>

				{/* 设置表单 */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* OpenRouter API Key */}
					<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							OpenRouter API Key
						</label>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
							获取 API Key：访问{' '}
							<a
								href="https://openrouter.ai/keys"
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 dark:text-blue-400 hover:underline"
							>
								https://openrouter.ai/keys
							</a>
						</p>
						<div className="relative">
							<input
								type={showApiKey ? 'text' : 'password'}
								value={formData.openRouterApiKey}
								onChange={(e) => setFormData({ ...formData, openRouterApiKey: e.target.value })}
								className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="sk-or-v1-..."
							/>
							<button
								type="button"
								onClick={() => setShowApiKey(!showApiKey)}
								className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
							>
								{showApiKey ? (
									<EyeOff className="w-5 h-5 text-gray-500" />
								) : (
									<Eye className="w-5 h-5 text-gray-500" />
								)}
							</button>
						</div>
						{formData.openRouterApiKey && (
							<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
								当前已设置 API Key（{formData.openRouterApiKey.substring(0, 10)}...）
							</p>
						)}
					</div>

					{/* 模型选择 */}
					<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
							选择模型
						</label>
						<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
							选择用于识别银行流水的 AI 模型。不同模型的准确度和成本不同。
						</p>
						<div className="space-y-3">
							{AVAILABLE_MODELS.map((model) => (
								<label
									key={model.id}
									className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
										formData.model === model.id
											? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
											: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
									}`}
								>
									<input
										type="radio"
										name="model"
										value={model.id}
										checked={formData.model === model.id}
										onChange={(e) => setFormData({ ...formData, model: e.target.value })}
										className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
									/>
									<div className="flex-1">
										<div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
										<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{model.description}</div>
										<div className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">{model.id}</div>
									</div>
								</label>
							))}
						</div>
					</div>

					{/* 操作按钮 */}
					<div className="flex gap-4">
						<button
							type="submit"
							className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
						>
							<Save className="w-5 h-5" />
							保存设置
						</button>
						<button
							type="button"
							onClick={handleReset}
							className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
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

