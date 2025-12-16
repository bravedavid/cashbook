'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RecognitionResult, TransactionItem, RecognitionResponse } from '@/types';
import { fileToBase64 } from '@/lib/imageUtils';
import { settings } from '@/lib/settings';
import ImageUpload from '@/components/ImageUpload';
import RecognitionItem from '@/components/RecognitionItem';
import { ArrowLeft, CheckCircle2, Settings, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ImportPage() {
	const [recognitionResults, setRecognitionResults] = useState<RecognitionResult[]>([]);
	const [savedCount, setSavedCount] = useState<number>(0);
	const isProcessingRef = useRef(false);
	const [hasApiKey, setHasApiKey] = useState(true);

	useEffect(() => {
		const appSettings = settings.getSettings();
		setHasApiKey(!!appSettings.openRouterApiKey);
	}, []);

	const recognizeImage = useCallback(async (result: RecognitionResult) => {
		try {
			const appSettings = settings.getSettings();
			
			if (!appSettings.openRouterApiKey) {
				setRecognitionResults((prev) =>
					prev.map((r) =>
						r.id === result.id
							? { ...r, status: 'error' as const, error: '请先在设置页面配置 OpenRouter API Key' }
							: r
					)
				);
				return;
			}

			const base64 = await fileToBase64(result.imageFile);
			const response = await fetch('/api/recognize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					imageBase64: base64,
					apiKey: appSettings.openRouterApiKey,
					model: appSettings.model,
				}),
			});

			const data = (await response.json()) as RecognitionResponse;

			if (data.success && data.transactions) {
				setRecognitionResults((prev) =>
					prev.map((r) =>
						r.id === result.id
							? { ...r, status: 'success' as const, transactions: data.transactions }
							: r
					)
				);
			} else {
				setRecognitionResults((prev) =>
					prev.map((r) =>
						r.id === result.id
							? { ...r, status: 'error' as const, error: data.error || '识别失败' }
							: r
					)
				);
			}
		} catch (error) {
			setRecognitionResults((prev) =>
				prev.map((r) =>
					r.id === result.id
						? { ...r, status: 'error' as const, error: error instanceof Error ? error.message : '识别失败' }
						: r
				)
			);
		} finally {
			isProcessingRef.current = false;
		}
	}, []);

	// 处理图片队列
	useEffect(() => {
		if (isProcessingRef.current) return;

		const pendingResults = recognitionResults.filter((r) => r.status === 'pending');
		if (pendingResults.length === 0) {
			return;
		}

		const nextResult = pendingResults[0];
		isProcessingRef.current = true;

		// 更新状态为处理中
		setRecognitionResults((prev) =>
			prev.map((r) => (r.id === nextResult.id ? { ...r, status: 'processing' as const } : r))
		);

		// 开始识别
		recognizeImage(nextResult);
	}, [recognitionResults, recognizeImage]);

	const handleImagesSelected = (files: File[]) => {
		const newResults: RecognitionResult[] = files.map((file) => ({
			id: crypto.randomUUID(),
			imageFile: file,
			imagePreview: URL.createObjectURL(file),
			status: 'pending' as const,
		}));

		setRecognitionResults((prev) => [...prev, ...newResults]);
	};

	const handleRetry = async (id: string) => {
		const result = recognitionResults.find((r) => r.id === id);
		if (!result) return;

		setRecognitionResults((prev) =>
			prev.map((r) => (r.id === id ? { ...r, status: 'processing' as const, error: undefined } : r))
		);

		await recognizeImage(result);
	};

	const handleConfirm = async (id: string, transactions: TransactionItem[]) => {
		try {
			// 批量保存交易记录
			for (const transaction of transactions) {
				const response = await fetch('/api/transactions', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						type: transaction.type,
						amount: transaction.amount.toString(),
						category: transaction.category,
						description: transaction.description,
						note: transaction.originalInfo || '', // 将原始交易信息保存到备注字段
						date: transaction.date,
					}),
				});

				if (!response.ok) {
					const data = (await response.json()) as { error?: string };
					throw new Error(data.error || '保存失败');
				}
			}

			setSavedCount((prev) => prev + transactions.length);

			// 移除已确认的结果
			setRecognitionResults((prev) => prev.filter((r) => r.id !== id));
		} catch (error) {
			console.error('Failed to save transactions:', error);
			alert('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
		}
	};

	const handleRemove = (id: string) => {
		setRecognitionResults((prev) => {
			const result = prev.find((r) => r.id === id);
			if (result) {
				URL.revokeObjectURL(result.imagePreview);
			}
			return prev.filter((r) => r.id !== id);
		});
	};

	const pendingCount = recognitionResults.filter((r) => r.status === 'pending' || r.status === 'processing').length;
	const successCount = recognitionResults.filter((r) => r.status === 'success').length;

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-4xl mx-auto px-4 py-8">
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
							<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">导入银行流水</h1>
							<p className="text-gray-500 dark:text-gray-400">上传银行流水图片，AI 将自动识别并提取交易记录</p>
						</div>
					</div>
					<Link
						href="/settings"
						className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
						title="设置"
					>
						<Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
					</Link>
				</div>

				{/* API Key 未配置提示 */}
				{!hasApiKey && (
					<div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
						<AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
						<div className="flex-1">
							<h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">需要配置 API Key</h3>
							<p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
								使用 AI 识别功能需要先配置 OpenRouter API Key
							</p>
							<Link
								href="/settings"
								className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
							>
								前往设置
							</Link>
						</div>
					</div>
				)}

				{/* 统计信息 */}
				{(recognitionResults.length > 0 || savedCount > 0) && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
							<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">总图片</div>
							<div className="text-2xl font-bold text-gray-900 dark:text-white">{recognitionResults.length}</div>
						</div>
						<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
							<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">处理中</div>
							<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pendingCount}</div>
						</div>
						<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
							<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">识别成功</div>
							<div className="text-2xl font-bold text-green-600 dark:text-green-400">{successCount}</div>
						</div>
						<div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
							<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">已保存</div>
							<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{savedCount}</div>
						</div>
					</div>
				)}

				{/* 图片上传 */}
				{recognitionResults.length === 0 && (
					<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
						<ImageUpload onImagesSelected={handleImagesSelected} />
					</div>
				)}

				{/* 识别结果列表 */}
				{recognitionResults.length > 0 && (
					<div className="space-y-4">
						{recognitionResults.map((result) => (
							<RecognitionItem
								key={result.id}
								result={result}
								onRetry={handleRetry}
								onConfirm={handleConfirm}
								onRemove={handleRemove}
							/>
						))}
					</div>
				)}

				{/* 添加更多图片 */}
				{recognitionResults.length > 0 && (
					<div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">添加更多图片</h3>
						<ImageUpload onImagesSelected={handleImagesSelected} />
					</div>
				)}

				{/* 完成提示 */}
				{savedCount > 0 && recognitionResults.length === 0 && (
					<div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
						<CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
						<h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
							成功导入 {savedCount} 条记录！
						</h3>
						<Link
							href="/"
							className="inline-block mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
						>
							返回首页
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}

