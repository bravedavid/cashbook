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

		// 设置 cookie
		response.cookies.set('session_token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60, // 7天
			path: '/',
		});

		return response;
	} catch (error) {
		console.error('Login error:', error);
		return NextResponse.json({ success: false, error: '登录失败' }, { status: 500 });
	}
}

