'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2 } from 'lucide-react';
import { LoginResponse } from '@/types';

export default function LoginPage() {
	const router = useRouter();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username, password }),
			});

			const data: LoginResponse = await response.json();

			if (data.success) {
				router.push('/');
				router.refresh();
			} else {
				setError(data.error || '登录失败');
			}
		} catch {
			setError('登录失败，请稍后重试');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center px-4 py-8">
			<div className="w-full max-w-sm">
				<div className="bg-white dark:bg-gray-800/50 rounded-3xl shadow-2xl p-8 sm:p-10 border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
					<div className="text-center mb-10">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
							<span className="text-3xl">💰</span>
						</div>
						<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">记账本</h1>
						<p className="text-gray-600 dark:text-gray-400">登录您的财务账户</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						{error && (
							<div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-l-4 border-red-500 rounded-lg p-4 text-red-700 dark:text-red-300 text-sm font-medium">
								<span className="font-semibold">出错：</span> {error}
							</div>
						)}

						<div>
							<label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
								用户名
							</label>
							<input
								id="username"
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full px-5 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
								placeholder="输入用户名"
								required
								autoComplete="username"
							/>
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
								密码
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-5 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
								placeholder="输入密码"
								required
								autoComplete="current-password"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:scale-100 flex items-center justify-center gap-3 text-lg"
						>
							{loading ? (
								<>
									<Loader2 className="w-6 h-6 animate-spin" />
									<span>登录中...</span>
								</>
							) : (
								<>
									<LogIn className="w-6 h-6" />
									<span>登录</span>
								</>
							)}
						</button>
					</form>

					<div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6">
						<p>如需创建账号，请联系管理员</p>
					</div>
				</div>
			</div>
		</div>
	);
}

