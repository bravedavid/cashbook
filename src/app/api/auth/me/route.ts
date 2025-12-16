import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { getD1Database } from '@/lib/db';

export async function GET(_request: NextRequest) {
	try {
		// 先检查 cookie 是否存在
		const cookieStore = await cookies();
		const sessionCookie = cookieStore.get('session_token');
		
		if (!sessionCookie || !sessionCookie.value) {
			console.log('[Auth/me] No session cookie found');
			return NextResponse.json({ success: false, error: '未登录：未找到会话 cookie' }, { status: 401 });
		}

		const token = sessionCookie.value;
		console.log('[Auth/me] Session token found, length:', token.length);

		// 检查数据库中是否有对应的会话
		try {
			const db = getD1Database();
			const session = await db
				.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")')
				.bind(token)
				.first<{ user_id: string }>();

			if (!session) {
				console.log('[Auth/me] Session not found in database or expired');
				return NextResponse.json({ success: false, error: '未登录：会话不存在或已过期' }, { status: 401 });
			}

			console.log('[Auth/me] Session found, user_id:', session.user_id);
			console.log('[Auth/me] Session object:', JSON.stringify(session, null, 2));
		} catch (dbError) {
			console.error('[Auth/me] Database error:', dbError);
			return NextResponse.json(
				{ success: false, error: `数据库错误: ${dbError instanceof Error ? dbError.message : '未知错误'}` },
				{ status: 500 }
			);
		}

		// 获取用户信息
		const user = await getCurrentUser();

		if (!user) {
			console.log('[Auth/me] User not found, returning 401');
			return NextResponse.json({ success: false, error: '未登录：用户不存在' }, { status: 401 });
		}

		console.log('[Auth/me] User authenticated:', user.username);
		return NextResponse.json({ success: true, user });
	} catch (error) {
		console.error('[Auth/me] Error getting current user:', error);
		if (error instanceof Error) {
			console.error('[Auth/me] Error message:', error.message);
			console.error('[Auth/me] Error stack:', error.stack);
			return NextResponse.json(
				{ success: false, error: `获取用户信息失败: ${error.message}` },
				{ status: 500 }
			);
		}
		return NextResponse.json({ success: false, error: '获取用户信息失败' }, { status: 500 });
	}
}

