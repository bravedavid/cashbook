'use client';

import { RecognitionResult, TransactionItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface RecognitionItemProps {
	result: RecognitionResult;
	onRetry: (id: string) => void;
	onConfirm: (id: string, transactions: TransactionItem[]) => void;
	onRemove: (id: string) => void;
}

export default function RecognitionItem({ result, onRetry, onConfirm, onRemove }: RecognitionItemProps) {
	const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
	const getCategory = (id: string) => allCategories.find((c) => c.id === id);

	const renderStatus = () => {
		switch (result.status) {
			case 'pending':
				return (
					<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
						<div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
						<span>等待识别...</span>
					</div>
				);
			case 'processing':
				return (
					<div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
						<Loader2 className="w-4 h-4 animate-spin" />
						<span>识别中...</span>
					</div>
				);
			case 'success':
				return (
					<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
						<CheckCircle2 className="w-4 h-4" />
						<span>识别成功</span>
					</div>
				);
			case 'error':
				return (
					<div className="flex items-center gap-2 text-red-600 dark:text-red-400">
						<XCircle className="w-4 h-4" />
						<span>识别失败</span>
					</div>
				);
		}
	};

	return (
		<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-4 flex-1">
					<div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={result.imagePreview}
							alt="预览"
							className="w-full h-full object-cover"
						/>
					</div>
					<div className="flex-1">
						<p className="font-medium text-gray-900 dark:text-white mb-2">{result.imageFile.name}</p>
						{renderStatus()}
						{result.error && (
							<p className="text-sm text-red-600 dark:text-red-400 mt-2">{result.error}</p>
						)}
					</div>
				</div>
				<button
					onClick={() => onRemove(result.id)}
					className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-red-500"
					title="删除"
				>
					<Trash2 className="w-5 h-5" />
				</button>
			</div>

			{/* 识别结果 */}
			{result.status === 'success' && result.transactions && result.transactions.length > 0 && (
				<div className="mt-4 space-y-3">
					<h4 className="font-medium text-gray-900 dark:text-white mb-3">
						识别到 {result.transactions.length} 条交易记录：
					</h4>
					<div className="space-y-2 max-h-64 overflow-y-auto">
						{result.transactions.map((transaction, index) => {
							const category = getCategory(transaction.category);
							const isIncome = transaction.type === 'income';

							return (
								<div
									key={index}
									className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
								>
									<div className="flex items-center gap-3 flex-1">
										<div
											className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
											style={{ backgroundColor: category?.color + '20' }}
										>
											{category?.icon || '💰'}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-medium text-gray-900 dark:text-white">
													{category?.name || transaction.category}
												</span>
												<span
													className={`text-xs px-2 py-0.5 rounded ${
														isIncome
															? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
															: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
													}`}
												>
													{isIncome ? '收入' : '支出'}
												</span>
											</div>
											<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
												{transaction.description}
											</p>
											{transaction.originalInfo && (
												<p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic" title={transaction.originalInfo}>
													原始信息: {transaction.originalInfo}
												</p>
											)}
											<p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
												{formatDate(transaction.date)}
											</p>
										</div>
									</div>
									<div>
										<span
											className={`text-lg font-bold ${
												isIncome
													? 'text-green-600 dark:text-green-400'
													: 'text-red-600 dark:text-red-400'
											}`}
										>
											{isIncome ? '+' : '-'}
											{formatCurrency(transaction.amount)}
										</span>
									</div>
								</div>
							);
						})}
					</div>
					<button
						onClick={() => onConfirm(result.id, result.transactions!)}
						disabled={result.saving}
						className="w-full mt-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
					>
						{result.saving ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								正在保存...
							</>
						) : (
							'确认添加这些记录'
						)}
					</button>
				</div>
			)}

			{result.status === 'success' && result.transactions && result.transactions.length === 0 && (
				<div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
					<p className="text-sm text-yellow-800 dark:text-yellow-200">
						未识别到交易记录，请确认图片是否包含银行流水信息
					</p>
				</div>
			)}

			{/* 错误重试 */}
			{result.status === 'error' && (
				<button
					onClick={() => onRetry(result.id)}
					className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
				>
					<RefreshCw className="w-4 h-4" />
					重试识别
				</button>
			)}
		</div>
	);
}

