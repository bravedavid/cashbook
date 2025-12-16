import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, createSession } from '@/lib/auth';

interface LoginRequest {
	username: string;
	password: string;
}

export async function POST(request: NextRequest) {
	try {
		const { username, password } = (await request.json()) as LoginRequest;

		if (!username || !password) {
			return NextResponse.json({ success: false, error: '用户名和密码不能为空' }, { status: 400 });
		}

		const user = await verifyCredentials(username, password);

		if (!user) {
			return NextResponse.json({ success: false, error: '用户名或密码错误' }, { status: 401 });
		}

		const token = await createSession(user.id);

		const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username } });

		// 判断是否是 HTTPS（生产环境）
		// 在 Cloudflare Workers 中，所有请求都通过 HTTPS
		const isSecure = request.url.startsWith('https://') || request.headers.get('x-forwarded-proto') === 'https';

		// 设置 cookie - 确保在生产环境中正确设置
		response.cookies.set('session_token', token, {
			httpOnly: true,
			secure: isSecure, // 在生产环境中必须是 true
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60, // 7天
			path: '/',
			// 不设置 domain，让浏览器自动处理（支持子域名）
		});

		console.log('[Auth/login] Cookie set:', {
			secure: isSecure,
			url: request.url,
			protocol: request.headers.get('x-forwarded-proto'),
			tokenLength: token.length,
			cookieHeader: response.headers.get('set-cookie'),
		});

		return response;
	} catch (error) {
		console.error('Login error:', error);
		return NextResponse.json({ success: false, error: '登录失败' }, { status: 500 });
	}
}

