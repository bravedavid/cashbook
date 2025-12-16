import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/auth';

export async function POST(_request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get('session_token')?.value;

		if (token) {
			await deleteSession(token);
		}

		const response = NextResponse.json({ success: true });

		// 清除 cookie
		response.cookies.delete('session_token');

		return response;
	} catch (error) {
		console.error('Logout error:', error);
		return NextResponse.json({ success: false, error: '登出失败' }, { status: 500 });
	}
}

