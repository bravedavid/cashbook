'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, TransactionFormData, AuthMeResponse, TransactionsResponse, TransactionResponse, DeleteResponse } from '@/types';
import { calculateTotal, calculateBalance } from '@/lib/utils';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import StatsCard from '@/components/StatsCard';
import { BarChart3, Upload, Settings, LogOut, User } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
	const router = useRouter();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
	const [user, setUser] = useState<{ id: string; username: string } | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadUser();
		loadTransactions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const loadUser = async () => {
		try {
			const response = await fetch('/api/auth/me');
			const data: AuthMeResponse = await response.json();
			if (data.success) {
				setUser(data.user || null);
			} else {
				router.push('/login');
			}
		} catch (error) {
			console.error('Failed to load user:', error);
			router.push('/login');
		} finally {
			setLoading(false);
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

	const handleAddTransaction = async (formData: TransactionFormData) => {
		try {
			const response = await fetch('/api/transactions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			const data: TransactionResponse = await response.json();
			if (data.success) {
				setTransactions([data.transaction!, ...transactions]);
				setShowForm(false);
			} else {
				alert('添加失败：' + (data.error || '未知错误'));
			}
		} catch (error) {
			console.error('Failed to add transaction:', error);
			alert('添加失败，请稍后重试');
		}
	};

	const handleUpdateTransaction = async (id: string, formData: TransactionFormData) => {
		try {
			const response = await fetch(`/api/transactions/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					type: formData.type,
					amount: parseFloat(formData.amount),
					category: formData.category,
					description: formData.description,
					date: formData.date,
				}),
			});

			const data: DeleteResponse = await response.json();
			if (data.success) {
				// 重新加载交易记录
				await loadTransactions();
				setEditingTransaction(null);
			} else {
				alert('更新失败：' + (data.error || '未知错误'));
			}
		} catch (error) {
			console.error('Failed to update transaction:', error);
			alert('更新失败，请稍后重试');
		}
	};

	const handleEditTransaction = (transaction: Transaction) => {
		setEditingTransaction(transaction);
		setShowForm(false);
	};

	const handleCancelEdit = () => {
		setEditingTransaction(null);
	};

	const handleDeleteTransaction = async (id: string) => {
		if (!confirm('确定要删除这条记录吗？')) {
			return;
		}

		try {
			const response = await fetch(`/api/transactions/${id}`, {
				method: 'DELETE',
			});

			const data: DeleteResponse = await response.json();
			if (data.success) {
				setTransactions(transactions.filter((t) => t.id !== id));
			} else {
				alert('删除失败：' + (data.error || '未知错误'));
			}
		} catch (error) {
			console.error('Failed to delete transaction:', error);
			alert('删除失败，请稍后重试');
		}
	};

	const handleLogout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			router.push('/login');
			router.refresh();
		} catch (error) {
			console.error('Failed to logout:', error);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
				<div className="text-gray-500 dark:text-gray-400">加载中...</div>
			</div>
		);
	}

	const income = calculateTotal(transactions, 'income');
	const expense = calculateTotal(transactions, 'expense');
	const balance = calculateBalance(transactions);

	const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* 头部 */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">记账本</h1>
						<p className="text-gray-500 dark:text-gray-400">记录每一笔收支，掌控你的财务状况</p>
					</div>
					<div className="flex items-center gap-3">
						{user && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
								<User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
								<span className="text-sm text-gray-700 dark:text-gray-300">{user.username}</span>
							</div>
						)}
						<Link
							href="/stats"
							className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
						>
							<BarChart3 className="w-5 h-5" />
							统计图表
						</Link>
						<Link
							href="/settings"
							className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
							title="设置"
						>
							<Settings className="w-6 h-6 text-gray-700 dark:text-gray-300" />
						</Link>
						<button
							onClick={handleLogout}
							className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
							title="登出"
						>
							<LogOut className="w-6 h-6 text-gray-700 dark:text-gray-300" />
						</button>
					</div>
				</div>

				{/* 统计卡片 */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<StatsCard title="总收入" amount={income} type="income" />
					<StatsCard title="总支出" amount={expense} type="expense" />
					<StatsCard title="余额" amount={balance} type="balance" />
				</div>

				{/* 添加/编辑记录表单 */}
				{showForm ? (
					<div className="mb-8">
						<TransactionForm onSubmit={handleAddTransaction} onCancel={() => setShowForm(false)} />
					</div>
				) : editingTransaction ? (
					<div className="mb-8">
						<TransactionForm
							mode="edit"
							initialData={{
								type: editingTransaction.type,
								amount: editingTransaction.amount.toString(),
								category: editingTransaction.category,
								description: editingTransaction.description,
								date: editingTransaction.date,
							}}
							onSubmit={(formData) => handleUpdateTransaction(editingTransaction.id, formData)}
							onCancel={handleCancelEdit}
						/>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
						<button
							onClick={() => setShowForm(true)}
							className="py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl"
						>
							添加新记录
						</button>
						<Link
							href="/import"
							className="py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
						>
							<Upload className="w-5 h-5" />
							导入银行流水
						</Link>
					</div>
				)}

				{/* 交易列表 */}
				<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">最近记录</h2>
					<TransactionList transactions={recentTransactions} onDelete={handleDeleteTransaction} onEdit={handleEditTransaction} />
				</div>
			</div>
		</div>
	);
}
